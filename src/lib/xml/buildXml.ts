// buildXml.ts — XML export dispatcher for all nine BIR forms.
//
// The 1701A exports in the *official* eBIRForms field format (importable into
// the offline package) via build1701A. The other eight forms don't have an
// official field-key map wired in yet, so they export a complete, well-formed
// *structured* XML — every taxpayer-background field, every raw input, and every
// computed value — using the same <div>KEY=VALUEKEY=</div> envelope and BIR tail.
// Swapping any form to byte-exact official output later only means adding a
// dedicated builder here, exactly like build1701A.

import type { Filing, FilingData, FilingRow, FormCode, Taxpayer } from "../../types";
import type { CompResult } from "../compute";
import { catalogEntry } from "../catalog";
import { displayName } from "../taxpayer";
import { parsePeriod } from "../period";
import { build1701 } from "./build1701";
import { build1701A } from "./build1701A";
import { build1701Q } from "./build1701Q";
import { build1702RT } from "./build1702RT";
import { build1702Q } from "./build1702Q";
import { build2550Q } from "./build2550Q";
import { build2551Q } from "./build2551Q";
import { amt, enc, formFileName, tinParts } from "./xmlkit";
import type {
  Comp1701, Comp1701A, Comp1701Q, Comp1702Q, Comp1702RT, Comp2550Q, Comp2551Q,
} from "../compute";

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/**
 * Build the eBIRForms-style XML string for a form. Five forms (1701A, 1701Q,
 * 1702RT, 2550Q, 2551Q) export in the *authentic* eBIRForms field format via a
 * dedicated builder; the remaining four (1701, 1702Q, 2307, 2316) use the
 * generic structured builder until their official samples are wired in.
 */
export function buildXml(
  form: FormCode,
  filing: Filing,
  tp: Taxpayer | null,
  comp: CompResult,
): string {
  switch (form) {
    case "1701":
      return build1701(filing, tp, comp as Comp1701);
    case "1701A":
      return build1701A(filing, tp, comp as Comp1701A);
    case "1701Q":
      return build1701Q(filing, tp, comp as Comp1701Q);
    case "1702RT":
      return build1702RT(filing, tp, comp as Comp1702RT);
    case "1702Q":
      return build1702Q(filing, tp, comp as Comp1702Q);
    case "2550Q":
      return build2550Q(filing, tp, comp as Comp2550Q);
    case "2551Q":
      return build2551Q(filing, tp, comp as Comp2551Q);
    default:
      return buildGeneric(form, filing, tp, comp);
  }
}

/**
 * Forms with no eBIRForms XML to import: the 2307 and 2316 certificates are
 * issued (printed/PDF) to payees/employees, not e-filed, so no XML is required.
 */
const XML_UNSUPPORTED: readonly FormCode[] = ["2307", "2316"];
export function xmlSupported(form: FormCode): boolean {
  return !XML_UNSUPPORTED.includes(form);
}

/** Canonical eBIRForms export filename — single source of truth in xmlkit. */
export function xmlFileName(form: FormCode, filing: Filing, tp: Taxpayer | null): string {
  return formFileName(form, filing, tp);
}

/**
 * Generic structured builder: emits taxpayer background, period, every raw
 * input field, and every computed value (recursively flattened) under the
 * frm{CODE} namespace. Pure — produces the same bytes for the same inputs.
 */
function buildGeneric(
  form: FormCode,
  filing: Filing,
  tp: Taxpayer | null,
  comp: CompResult,
): string {
  const d: FilingData = filing.data || {};
  const ns = "frm" + form;
  const t = tinParts(tp);
  const { year, quarter } = parsePeriod(filing.period || String(d.year || ""));
  const rows: Array<[string, string]> = [];
  const put = (key: string, val: unknown, raw = false) =>
    rows.push([ns + ":" + key, raw ? (val == null ? "" : String(val)) : enc(val)]);

  // ---- Identification / period ----
  put("FormType", form, true);
  put("FormName", catalogEntry(form)?.name || "", false);
  put("Year", year || "", true);
  if (quarter) put("Quarter", quarter, true);
  put("Period", filing.period || year || "", false);
  put("Status", filing.status, true);

  // ---- Taxpayer background ----
  put("TIN1", t.t1, true);
  put("TIN2", t.t2, true);
  put("TIN3", t.t3, true);
  put("BranchCode", t.branch3, true);
  put("RDOCode", (tp && tp.rdo) || "", false);
  put("TaxpayerName", displayName(tp), false);
  if (tp) {
    put("RegisteredName", tp.regName || "", false);
    put("LastName", tp.lastName || "", false);
    put("FirstName", tp.firstName || "", false);
    put("MiddleName", tp.middleName || "", false);
    put("Address", [tp.address, tp.city].filter(Boolean).join(" "), false);
    put("ZipCode", tp.zip || "", false);
    put("Email", tp.email || "", false);
    put("TelNum", tp.phone || "", false);
    put("Citizenship", tp.citizenship || "", false);
    put("CivilStatus", tp.civilStatus || "", false);
    put("Classification", tp.classification || "", false);
  }

  // ---- Raw input fields (everything the user typed; rows handled separately) ----
  Object.keys(d)
    .filter((k) => k !== "year" && k !== "quarter" && k !== "rows")
    .sort()
    .forEach((k) => {
      const v = d[k];
      if (Array.isArray(v)) return; // row tables emitted below
      if (v == null || v === "") return;
      put("data_" + k, v, false);
    });

  // ---- Repeating-line tables (2307 / 2551Q live under data.rows) ----
  const dataRows = d.rows;
  if (Array.isArray(dataRows)) {
    dataRows.forEach((row: FilingRow, i) => {
      Object.keys(row)
        .sort()
        .forEach((k) => {
          const v = row[k];
          if (v == null || v === "") return;
          put(`row${i + 1}_${k}`, v, false);
        });
    });
  }

  // ---- Computed values (recursively flattened; amounts to "1,234.00") ----
  flatten(comp as unknown as Record<string, unknown>, "comp", (key, value) => {
    if (isNum(value)) put(key, amt(value), true);
    else if (typeof value === "boolean") put(key, value ? "true" : "false", true);
    else if (value != null && value !== "") put(key, value, false);
  });

  // ---- meta / package tail ----
  put("txtCurrentPage", "1", true);
  put("txtFinalFlag", filing.status === "filed" ? "1" : "0", true);
  put("txtEnroll", "Y", true);

  const body = rows
    .map(([k, v]) => "            <div>" + k + "=" + v + k + "=</div>\t")
    .join("\n");
  return "<?xml version='1.0'?>\t\n" + body + "\n            \t\n            All Rights Reserved BIR 2012.0";
}

/** Walk a nested computed-result object, calling emit(key, leafValue) for each leaf. */
function flatten(
  obj: Record<string, unknown> | unknown[],
  prefix: string,
  emit: (key: string, value: unknown) => void,
): void {
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => {
      const key = `${prefix}${i + 1}`;
      if (v && typeof v === "object") flatten(v as Record<string, unknown>, key, emit);
      else emit(key, v);
    });
    return;
  }
  Object.keys(obj).forEach((k) => {
    const v = (obj as Record<string, unknown>)[k];
    const key = `${prefix}_${k}`;
    if (v && typeof v === "object") flatten(v as Record<string, unknown> | unknown[], key, emit);
    else emit(key, v);
  });
}

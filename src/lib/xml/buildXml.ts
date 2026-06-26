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
import { amt, build1701A, enc, fileName as fileName1701A, parseYear, tinParts } from "./build1701A";
import type { Comp1701A } from "../compute";

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Build the eBIRForms-style XML string for any form (1701A is official). */
export function buildXml(
  form: FormCode,
  filing: Filing,
  tp: Taxpayer | null,
  comp: CompResult,
): string {
  if (form === "1701A") return build1701A(filing, tp, comp as Comp1701A);
  return buildGeneric(form, filing, tp, comp);
}

/** Canonical export filename for any form (1701A matches the official package). */
export function xmlFileName(form: FormCode, filing: Filing, tp: Taxpayer | null): string {
  if (form === "1701A") return fileName1701A(filing, tp);
  const t = tinParts(tp);
  const { year, quarter } = parsePeriod(filing.period || String((filing.data || {}).year || ""));
  const period = quarter ? `${year}${quarter}` : year || parseYear((filing.data || {}).year).yyyy;
  return `${t.t1}${t.t2}${t.t3}${t.branch.padStart(3, "0").slice(0, 3)}-${form}-${period}.xml`;
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
  put("BranchCode", t.branch, true);
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

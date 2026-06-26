// xmlkit.ts — shared helpers for the eBIRForms XML builders.
//
// Every BIR offline-package export is a flat list of
//   <div>KEY=VALUEKEY=</div>
// blocks wrapped by `<?xml version='1.0'?>` and an "All Rights Reserved BIR …"
// tail. Field keys, the per-form namespace, the separator whitespace and the
// tail year all vary per form, so each builder owns its own field list and
// assembly; this module only provides the value-formatting + assembly atoms.

import type { Taxpayer } from "../../types";
import { num } from "../format";

/** URL-encode a value the eBIRForms way (comma→%2C, space→%20). */
export function enc(v: unknown): string {
  if (v == null) return "";
  return encodeURIComponent(String(v));
}

/** Money → "1,234,567.00". */
export function amt(n: unknown): string {
  return num(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Radio/checkbox boolean → "true"/"false". */
export const rb = (cond: boolean): string => (cond ? "true" : "false");

/** ISO yyyy-mm-dd → MM/DD/YYYY (eBIRForms date format). */
export function dob(iso?: string): string {
  if (!iso) return "";
  const p = String(iso).split("-");
  if (p.length === 3) return p[1] + "/" + p[2] + "/" + p[0];
  return iso;
}

export interface TinParts {
  t1: string;
  t2: string;
  t3: string;
  /** 3-digit branch code ("000" head office). */
  branch3: string;
  /** 5-digit branch code ("00000" head office). */
  branch5: string;
}

/** Split a taxpayer TIN into the 3×3 groups + branch code. */
export function tinParts(tp: Taxpayer | null): TinParts {
  const d = String((tp && tp.tin) || "").replace(/\D/g, "");
  const b = String((tp && tp.branch) || "0").replace(/\D/g, "") || "0";
  return {
    t1: d.slice(0, 3),
    t2: d.slice(3, 6),
    t3: d.slice(6, 9),
    branch3: b.padStart(3, "0").slice(-3),
    branch5: b.padStart(5, "0").slice(-5),
  };
}

/** { mm, yyyy } from a year value ("2025" or "12/2025"). */
export function parseYear(y: unknown): { mm: string; yyyy: string } {
  const s = String(y || "");
  if (s.includes("/")) {
    const [m, yr] = s.split("/");
    return { mm: (m || "12").padStart(2, "0"), yyyy: yr || "" };
  }
  return { mm: "12", yyyy: s.slice(0, 4) };
}

export type XmlRow = [key: string, value: string];

/**
 * Assemble the final document from key/value rows.
 * `lead`/`trail` wrap each <div>; `sep` joins them; `head` and `tail` bookend.
 * Defaults reproduce the common "12-space indent, tab-suffixed line" style.
 */
export function assemble(
  rows: XmlRow[],
  opts: { lead?: string; trail?: string; sep?: string; head?: string; tail: string },
): string {
  const lead = opts.lead ?? "            ";
  const trail = opts.trail ?? "\t";
  const sep = opts.sep ?? "\n";
  const head = opts.head ?? "<?xml version='1.0'?>\t\n";
  const body = rows.map(([k, v]) => `${lead}<div>${k}=${v}${k}=</div>${trail}`).join(sep);
  return `${head}${body}${sep}${opts.tail}`;
}

/** Trigger a browser download of an XML string (no-op outside the browser). */
export function download(filename: string, text: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([text], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

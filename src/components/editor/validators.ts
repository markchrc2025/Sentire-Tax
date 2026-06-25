// validators.ts — per-form checklist warnings shown in the rail / review step.
// Ported from validate1701A in bir-shell2.jsx (only 1701A has checks today).

import type { FilingData, FormCode } from "../../types";
import type { Comp1701A } from "../../lib/compute";
import { num } from "../../lib/format";

export interface ValidationItem {
  level: "warn" | "ok";
  msg: string;
}

export function validate1701A(d: FilingData, comp: Comp1701A): ValidationItem[] {
  const out: ValidationItem[] = [];
  if (!d.year) out.push({ level: "warn", msg: "Enter the taxable year (Item 1)." });
  if (!d.taxRate) out.push({ level: "warn", msg: "Choose a tax rate (Item 19)." });
  if (!d.atc) out.push({ level: "warn", msg: "Select an ATC (Item 7)." });
  const sales = num(d.taxRate === "eight" ? d.i47A : d.i36A);
  if (!sales) out.push({ level: "warn", msg: "Enter sales/revenues in Part IV." });
  if (d.taxRate === "eight" && comp.A.i53 > 3000000)
    out.push({ level: "warn", msg: "8% rate unavailable — sales exceed ₱3M." });
  if (num(d.i23A) > comp.A.i20 * 0.5 + 1)
    out.push({ level: "warn", msg: "2nd installment (Item 23) can't exceed 50% of tax due." });
  return out;
}

/** Dispatch validation by form (currently only 1701A has rules). */
export function validateFor(form: FormCode, data: FilingData, comp: unknown): ValidationItem[] {
  if (form === "1701A") return validate1701A(data, comp as Comp1701A);
  return [];
}

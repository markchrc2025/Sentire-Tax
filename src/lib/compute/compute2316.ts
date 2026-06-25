// compute2316.ts — 2316 (Certificate of Compensation Payment / Tax Withheld).
// Ported verbatim from B.compute2316 in bir-compute2.jsx.

import type { FilingData } from "../../types";
import { num, roundPeso } from "../format";
import { graduatedTax as grad } from "../taxTables";

export interface Comp2316 {
  /** Total non-taxable / exempt compensation (items 29–37 → 38). */
  i38: number;
  reg: number;
  supp: number;
  /** Total taxable compensation, present employer (item 26). */
  i26: number;
  i52: number;
  i19: number;
  i20: number;
  i21: number;
  i22: number;
  /** Gross taxable compensation income. */
  i23: number;
  /** Tax due (graduated on gross taxable comp). */
  i24: number;
  i25A: number;
  i25B: number;
  i25: number;
  i27: number;
  /** Total taxes withheld. */
  i28: number;
}

export function compute2316(d: FilingData): Comp2316 {
  const o = {} as Comp2316;
  // Non-taxable (29-37) -> 38
  o.i38 = [29, 30, 31, 32, 33, 34, 35, 36, 37].reduce((s, n) => s + num(d["i" + n]), 0);
  // Taxable regular (39-50) + supplementary (51,51A,51B) -> 26
  const reg = [39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50].reduce(
    (s, n) => s + num(d["i" + n]),
    0,
  );
  const supp = num(d.i51) + num(d.i51A) + num(d.i51B);
  o.reg = reg;
  o.supp = supp;
  o.i26 = reg + supp; // total taxable comp present
  o.i52 = o.i26; // = item 52 (gross taxable from present)
  o.i19 = o.i38 + o.i52; // gross comp income present
  o.i20 = o.i38; // less non-taxable
  o.i21 = o.i19 - o.i20; // taxable comp present
  o.i22 = num(d.i22); // add previous employer
  o.i23 = o.i21 + o.i22; // gross taxable comp
  o.i24 = roundPeso(grad(o.i23, String(d.year || "").slice(0, 4))); // tax due
  o.i25A = num(d.i25A);
  o.i25B = num(d.i25B);
  o.i25 = o.i25A + o.i25B; // adjusted taxes withheld
  o.i27 = num(d.i27); // PERA 5% credit
  o.i28 = o.i25 + o.i27; // total taxes withheld
  return o;
}

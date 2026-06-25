// compute1702Q.ts — 1702Q (Quarterly ITR, corporations/non-individuals; MCIT-aware).
// Ported verbatim from B.compute1702Q in bir-compute2.jsx.

import type { FilingData } from "../../types";
import { num, roundPeso } from "../format";

export interface Comp1702Q {
  /** Regular/normal rate (%) — default 25. */
  rate: number;
  // Schedule 2 — Regular/Normal Rate
  s2_1: number;
  s2_2: number;
  s2_3: number;
  s2_4: number;
  s2_5: number;
  /** 'itemized' | 'osd' */
  method: string;
  s2_6: number;
  s2_7: number;
  s2_8: number;
  s2_9: number;
  s2_10: number;
  /** Income tax due at the normal rate. */
  s2_11: number;
  /** MCIT — 2% of gross income. */
  mcit: number;
  /** Income tax due — higher of normal vs MCIT. */
  s2_13: number;
  mcitApplies: boolean;
  // Part II
  i14: number;
  i15: number;
  i16: number;
  i17: number;
  i18: number;
  i19: number;
  i20: number;
  i21: number;
  i22: number;
  i23: number;
  i24: number;
  i25: number;
}

export function compute1702Q(d: FilingData): Comp1702Q {
  const o = {} as Comp1702Q;
  const rate = d.rate == null || d.rate === "" ? 25 : num(d.rate);
  o.rate = rate;
  // Schedule 2 — Regular/Normal Rate
  o.s2_1 = num(d.s2_1); // sales
  o.s2_2 = num(d.s2_2); // cost of sales
  o.s2_3 = o.s2_1 - o.s2_2; // gross income from operation
  o.s2_4 = num(d.s2_4); // non-operating/other
  o.s2_5 = o.s2_3 + o.s2_4; // total gross income
  o.method = (d.method as string) || "itemized";
  o.s2_6 = o.method === "osd" ? roundPeso(o.s2_5 * 0.4) : num(d.s2_6); // deductions
  o.s2_7 = o.s2_5 - o.s2_6; // taxable income this quarter
  o.s2_8 = num(d.s2_8); // taxable income previous quarters
  o.s2_9 = o.s2_7 + o.s2_8; // total taxable income to date
  o.s2_10 = rate;
  o.s2_11 = roundPeso((o.s2_9 * rate) / 100); // income tax due (normal)
  o.mcit = roundPeso(o.s2_5 * 0.02); // MCIT 2% of gross income
  o.s2_13 = Math.max(o.s2_11, o.mcit); // income tax due (higher)
  o.mcitApplies = o.mcit > o.s2_11;
  // Part II
  o.i14 = o.s2_13;
  o.i15 = num(d.i15); // less unexpired excess MCIT
  o.i16 = o.i14 - o.i15; // balance regular
  o.i17 = num(d.i17); // add special rate
  o.i18 = o.i16 + o.i17; // aggregate income tax due
  o.i19 = num(d.i19); // total credits/payments
  o.i20 = o.i18 - o.i19; // net tax payable
  o.i21 = num(d.i21);
  o.i22 = num(d.i22);
  o.i23 = num(d.i23);
  o.i24 = o.i21 + o.i22 + o.i23; // penalties
  o.i25 = o.i20 + o.i24; // total amount payable
  return o;
}

// compute1702RT.ts — 1702-RT (Annual ITR, corporations, regular rate; MCIT-aware).
// Ported verbatim from B.compute1702RT in bir-compute2.jsx.

import type { FilingData } from "../../types";
import { num, roundPeso } from "../format";

export interface Comp1702RT {
  /** Regular/normal rate (%) — default 25. */
  rate: number;
  i27: number;
  i28: number;
  i29: number;
  i30: number;
  i31: number;
  i32: number;
  i33: number;
  /** 'itemized' | 'osd' */
  method: string;
  i34: number;
  i35: number;
  i36: number;
  i37: number;
  i38: number;
  i39: number;
  i40: number;
  /** Income tax due at the normal rate. */
  i41: number;
  /** MCIT — 2% of gross income. */
  i42: number;
  /** Tax due — higher of normal vs MCIT. */
  i43: number;
  mcitApplies: boolean;
  i44: number;
  i45: number;
  i46: number;
  i47: number;
  i48: number;
  i49: number;
  i50: number;
  i51: number;
  i52: number;
  i53: number;
  i54: number;
  i55: number;
  i56: number;
  i14: number;
  i15: number;
  i16: number;
  i17: number;
  i18: number;
  i19: number;
  i20: number;
  i21: number;
}

export function compute1702RT(d: FilingData): Comp1702RT {
  const o = {} as Comp1702RT;
  const rate = d.rate == null || d.rate === "" ? 25 : num(d.rate); // % regular/normal
  o.rate = rate;
  o.i27 = num(d.i27); // sales/receipts
  o.i28 = num(d.i28); // returns
  o.i29 = o.i27 - o.i28; // net sales
  o.i30 = num(d.i30); // cost of sales
  o.i31 = o.i29 - o.i30; // gross income from operation
  o.i32 = num(d.i32); // other taxable income
  o.i33 = o.i31 + o.i32; // total taxable income (gross)
  o.method = (d.method as string) || "itemized";
  o.i34 = num(d.i34);
  o.i35 = num(d.i35);
  o.i36 = num(d.i36);
  o.i37 = o.i34 + o.i35 + o.i36; // total itemized deductions
  o.i38 = roundPeso(o.i33 * 0.4); // OSD = 40% of gross income (item 33)
  o.i39 = o.method === "osd" ? o.i33 - o.i38 : o.i33 - o.i37; // net taxable income
  o.i40 = rate;
  o.i41 = roundPeso((o.i39 * rate) / 100); // income tax due (normal)
  o.i42 = roundPeso(o.i33 * 0.02); // MCIT 2% of gross income
  o.i43 = Math.max(o.i41, o.i42); // tax due (higher)
  o.mcitApplies = o.i42 > o.i41;
  // credits 44-54
  o.i44 = num(d.i44);
  o.i45 = num(d.i45);
  o.i46 = num(d.i46);
  o.i47 = num(d.i47);
  o.i48 = num(d.i48);
  o.i49 = num(d.i49);
  o.i50 = num(d.i50);
  o.i51 = num(d.i51);
  o.i52 = num(d.i52);
  o.i53 = num(d.i53);
  o.i54 = num(d.i54);
  o.i55 = o.i44 + o.i45 + o.i46 + o.i47 + o.i48 + o.i49 + o.i50 + o.i51 + o.i52 + o.i53 + o.i54;
  o.i56 = o.i43 - o.i55; // net tax payable
  // Part II
  o.i14 = o.i43;
  o.i15 = o.i55;
  o.i16 = o.i56;
  o.i17 = num(d.i17);
  o.i18 = num(d.i18);
  o.i19 = num(d.i19);
  o.i20 = o.i17 + o.i18 + o.i19; // penalties
  o.i21 = o.i16 + o.i20; // total amount payable
  return o;
}

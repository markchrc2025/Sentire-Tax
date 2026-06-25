// compute2550Q.ts — 2550Q (Quarterly VAT return; full Part IV line flow).
// Ported verbatim from B.compute2550Q in bir-compute2.jsx.

import type { FilingData } from "../../types";
import { num, roundPeso } from "../format";

export interface Comp2550Q {
  // Output side
  i31a: number;
  i31b: number;
  i32a: number;
  i33a: number;
  i34a: number;
  i34b: number;
  i35b: number;
  i36b: number;
  i37: number;
  // Input tax carried over (38-42) -> 43
  i38: number;
  i39: number;
  i40: number;
  i41: number;
  i42: number;
  i43: number;
  // Current transactions (44-50)
  i44a: number;
  i44b: number;
  i45a: number;
  i45b: number;
  i46a: number;
  i46b: number;
  i47a: number;
  i47b: number;
  i48a: number;
  i49a: number;
  i50a: number;
  i50b: number;
  i51: number;
  // Deductions/adjustments (52-60)
  i52: number;
  i53: number;
  i54: number;
  i55: number;
  i56: number;
  i57: number;
  i58: number;
  i59: number;
  i60: number;
  i61: number;
  inputTotal: number;
  // Part II rollup
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
  i26: number;
}

export function compute2550Q(d: FilingData): Comp2550Q {
  const o = {} as Comp2550Q;
  // Output side
  o.i31a = num(d.i31a);
  o.i31b = roundPeso(o.i31a * 0.12); // output tax 12%
  o.i32a = num(d.i32a);
  o.i33a = num(d.i33a);
  o.i34a = o.i31a + o.i32a + o.i33a; // total sales
  o.i34b = o.i31b; // total output tax due
  o.i35b = num(d.i35b);
  o.i36b = num(d.i36b);
  o.i37 = o.i34b - o.i35b + o.i36b; // adjusted output tax due

  // Input tax carried over block (38-42) -> 43
  o.i38 = num(d.i38);
  o.i39 = num(d.i39);
  o.i40 = num(d.i40);
  o.i41 = num(d.i41);
  o.i42 = num(d.i42);
  o.i43 = o.i38 + o.i39 + o.i40 + o.i41 + o.i42;

  // Current transactions (44-50)
  o.i44a = num(d.i44a);
  o.i44b = num(d.i44b);
  o.i45a = num(d.i45a);
  o.i45b = num(d.i45b);
  o.i46a = num(d.i46a);
  o.i46b = num(d.i46b);
  o.i47a = num(d.i47a);
  o.i47b = num(d.i47b);
  o.i48a = num(d.i48a);
  o.i49a = num(d.i49a);
  o.i50a = o.i44a + o.i45a + o.i46a + o.i47a + o.i48a + o.i49a; // total current purchases
  o.i50b = o.i44b + o.i45b + o.i46b + o.i47b; // total current input tax
  o.i51 = o.i43 + o.i50b; // total available input tax

  // Deductions/adjustments (52-60)
  o.i52 = num(d.i52);
  o.i53 = num(d.i53);
  o.i54 = num(d.i54);
  o.i55 = num(d.i55);
  o.i56 = num(d.i56);
  o.i57 = o.i52 + o.i53 + o.i54 + o.i55 + o.i56;
  o.i58 = num(d.i58);
  o.i59 = o.i57 + o.i58; // adjusted deductions
  o.i60 = o.i51 - o.i59; // total allowable input tax
  o.i61 = o.i37 - o.i60; // net VAT payable (To Part II Item 15)
  o.inputTotal = o.i60; // backward-compat

  // Part II rollup
  o.i15 = o.i61;
  o.i16 = num(d.i16);
  o.i17 = num(d.i17);
  o.i18 = num(d.i18);
  o.i19 = num(d.i19);
  o.i20 = o.i16 + o.i17 + o.i18 + o.i19; // total credits
  o.i21 = o.i15 - o.i20; // tax still payable
  o.i22 = num(d.i22);
  o.i23 = num(d.i23);
  o.i24 = num(d.i24);
  o.i25 = o.i22 + o.i23 + o.i24; // penalties
  o.i26 = o.i21 + o.i25; // total payable
  return o;
}

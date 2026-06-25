// compute1701Q.ts — 1701Q (Quarterly ITR, individuals/estates/trusts).
// Ported verbatim from B.compute1701Q in bir-compute2.jsx.

import type { FilingData } from "../../types";
import { num, roundPeso } from "../format";
import { graduatedTax as grad } from "../taxTables";

export interface Side1701Q {
  sales: number;
  returns: number;
  netSales: number;
  cogs: number;
  gross: number;
  /** 'itemized' | 'osd' */
  method: string;
  deductions: number;
  netIncome: number;
  otherInc: number;
  prevTaxable: number;
  taxableThis: number;
  taxableCum: number;
  gradTax: number;
  gross8: number;
  prev8: number;
  cum8: number;
  reduce8: number;
  taxable8: number;
  tax8: number;
  /** 'graduated' | 'eight' */
  rate: string;
  taxDue: number;
  prevPaid: number;
  cwt: number;
  excess: number;
  credits: number;
  payable: number;
  penalties: number;
  totalPayable: number;
}

export interface Comp1701Q {
  A: Side1701Q;
  B: Side1701Q;
  aggregate: number;
}

export function compute1701Q(d: FilingData): Comp1701Q {
  const year = String(d.year || "").slice(0, 4);
  const out = { A: {}, B: {} } as Comp1701Q;
  (["A", "B"] as const).forEach((s) => {
    const o = {} as Side1701Q;
    // graduated schedule I
    o.sales = num(d["sales" + s]);
    o.returns = num(d["returns" + s]);
    o.netSales = o.sales - o.returns;
    o.cogs = num(d["cogs" + s]);
    o.gross = o.netSales - o.cogs; // gross income
    o.method = (d["method" + s] as string) || "osd";
    o.deductions = o.method === "osd" ? roundPeso(o.netSales * 0.4) : num(d["deduct" + s]);
    o.netIncome = o.gross - o.deductions;
    o.otherInc = num(d["other" + s]);
    o.prevTaxable = num(d["prevTaxable" + s]);
    o.taxableThis = o.netIncome + o.otherInc;
    o.taxableCum = o.taxableThis + o.prevTaxable;
    o.gradTax = roundPeso(grad(o.taxableCum, year));
    // 8% schedule II
    o.gross8 = o.netSales + o.otherInc;
    o.prev8 = num(d["prev8" + s]);
    o.cum8 = o.gross8 + o.prev8;
    o.reduce8 = s === "A" ? 250000 : 0;
    o.taxable8 = Math.max(0, o.cum8 - o.reduce8);
    o.tax8 = roundPeso(o.taxable8 * 0.08);
    o.rate = (d["rate" + s] as string) || "graduated";
    o.taxDue = o.rate === "eight" ? o.tax8 : o.gradTax;
    // credits
    o.prevPaid = num(d["prevPaid" + s]);
    o.cwt = num(d["cwt" + s]);
    o.excess = num(d["excess" + s]);
    o.credits = o.prevPaid + o.cwt + o.excess;
    o.payable = o.taxDue - o.credits;
    o.penalties = num(d["pen" + s]);
    o.totalPayable = o.payable + o.penalties;
    out[s] = o;
  });
  out.aggregate = out.A.totalPayable + out.B.totalPayable;
  return out;
}

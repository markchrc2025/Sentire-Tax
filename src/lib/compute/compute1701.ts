// compute1701.ts — 1701 (Annual ITR, individuals with mixed income).
// Ported verbatim from B.compute1701 in bir-compute2.jsx.

import type { FilingData } from "../../types";
import { num, roundPeso } from "../format";
import { graduatedTax as grad } from "../taxTables";

// Schedule 4 ordinary-itemized-deduction row keys (16 categories + 17a-d).
const SCHED4_KEYS = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16",
  "17a", "17b", "17c", "17d",
];

export interface Side1701 {
  comp: number;
  sales: number;
  returns: number;
  netSales: number;
  cogs: number;
  gross: number;
  /** 'itemized' | 'osd' */
  method: string;
  /** Schedule 4 ordinary itemized total (Item 13 / Sched 4 Item 18). */
  itemizedOrdinary: number;
  /** Schedule 5 special itemized total (Item 14). */
  itemizedSpecial: number;
  /** NOLCO applied this year (Item 15 / Schedule 6 Item 8 or 13). */
  nolco: number;
  deductions: number;
  netBiz: number;
  otherInc: number;
  netBizTotal: number;
  /** 'graduated' | 'eight' */
  rate: string;
  gross8: number;
  taxable8: number;
  tax8biz: number;
  taxableTotal: number;
  taxDue: number;
  prevPaid: number;
  cwt: number;
  excess: number;
  taxWithheldComp: number;
  credits: number;
  payable: number;
  installment: number;
  afterInstall: number;
  penalties: number;
  totalPayable: number;
}

export interface Comp1701 {
  A: Side1701;
  B: Side1701;
  aggregate: number;
}

export function compute1701(d: FilingData): Comp1701 {
  const year = String(d.year || "").slice(0, 4);
  const out = { A: {}, B: {} } as Comp1701;
  (["A", "B"] as const).forEach((s) => {
    const o = {} as Side1701;
    o.comp = num(d["comp" + s]); // taxable compensation income
    o.sales = num(d["sales" + s]);
    o.returns = num(d["returns" + s]);
    o.netSales = o.sales - o.returns;
    o.cogs = num(d["cogs" + s]);
    o.gross = o.netSales - o.cogs;
    o.method = (d["method" + s] as string) || "osd";
    // Itemized deductions: prefer the detailed Schedule 4 (ordinary) + Schedule 5
    // (special) line entries; fall back to the single aggregate field if none
    // were entered. OSD is always 40% of net sales.
    const sched4 = SCHED4_KEYS.reduce((t, k) => t + num(d[`s4_${k}${s}`]), 0);
    const special =
      s === "A"
        ? num(d.s5_3amt) || num(d.s5_1amt) + num(d.s5_2amt)
        : num(d.s5_6amt) || num(d.s5_4amt) + num(d.s5_5amt);
    // NOLCO applied this year = total of the "D" column (NOLCO Applied Current
    // Year) in the per-side Schedule 6 detail table — taxpayer rows 4-7
    // (Sched 6.A.1, → Item 8), spouse rows 9-12 (Sched 6.A.2, → Item 13).
    const nolcoRows = s === "A" ? [4, 5, 6, 7] : [9, 10, 11, 12];
    o.nolco = o.method === "osd" ? 0 : nolcoRows.reduce((t, r) => t + num(d[`nolco${r}D`]), 0);
    const itemizedDetail = sched4 + special + o.nolco;
    // Expose the ordinary (Schedule 4), special (Schedule 5) and NOLCO sub-totals
    // so the form's Items 13/14/15/16 + Schedule 4 Item 18 show computed values.
    o.itemizedOrdinary = sched4 > 0 ? sched4 : itemizedDetail > 0 ? 0 : num(d["deduct" + s]);
    o.itemizedSpecial = special;
    o.deductions =
      o.method === "osd"
        ? roundPeso(o.netSales * 0.4)
        : itemizedDetail > 0
          ? itemizedDetail
          : num(d["deduct" + s]);
    o.netBiz = o.gross - o.deductions;
    o.otherInc = num(d["other" + s]);
    o.netBizTotal = o.netBiz + o.otherInc;
    o.rate = (d["rate" + s] as string) || "graduated";
    // 8% path: gross sales + other, less 250k (filer only)
    o.gross8 = o.netSales + o.otherInc;
    o.taxable8 = Math.max(0, o.gross8 - (s === "A" ? 250000 : 0));
    o.tax8biz = roundPeso(o.taxable8 * 0.08);
    o.taxableTotal = o.rate === "eight" ? o.comp + o.taxable8 : o.comp + o.netBizTotal;
    // tax due: 8% on biz + graduated on comp ; graduated on combined otherwise
    o.taxDue =
      o.rate === "eight"
        ? roundPeso(grad(o.comp, year)) + o.tax8biz
        : roundPeso(grad(o.comp + o.netBizTotal, year));
    o.prevPaid = num(d["prevPaid" + s]);
    o.cwt = num(d["cwt" + s]);
    o.excess = num(d["excess" + s]);
    o.taxWithheldComp = num(d["compCwt" + s]);
    o.credits = o.prevPaid + o.cwt + o.excess + o.taxWithheldComp;
    o.payable = o.taxDue - o.credits;
    o.installment = num(d["install" + s]);
    o.afterInstall = o.payable - o.installment;
    // Penalties: the faithful form splits these into Interest / Surcharge /
    // Compromise (items 27-29); the guided uses a single "pen" bucket. Sum the
    // three split lines when present, else fall back to the single field.
    const split = num(d["interest" + s]) + num(d["surcharge" + s]) + num(d["compromise" + s]);
    o.penalties = split > 0 ? split : num(d["pen" + s]);
    o.totalPayable = o.afterInstall + o.penalties;
    out[s] = o;
  });
  out.aggregate = out.A.totalPayable + out.B.totalPayable;
  return out;
}

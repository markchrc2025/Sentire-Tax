// railSummary.tsx — form-aware summary rows for the editor rail.
// Ported from railSummary / SumRow in bir-shell2.jsx.

import type { FilingData, FormCode } from "../../types";
import type {
  Comp1701,
  Comp1701A,
  Comp1701Q,
  Comp1702Q,
  Comp1702RT,
  Comp2307,
  Comp2316,
  Comp2550Q,
  Comp2551Q,
  CompResult,
} from "../../lib/compute";
import { peso } from "../../lib/format";

export interface SumRowData {
  lbl: string;
  val: string;
  big?: boolean;
  neg?: boolean;
}
export type SumEntry = SumRowData | { div: true };

export function SumRow({ lbl, val, big, neg }: SumRowData) {
  return (
    <div className={"s-sum-row" + (big ? " big" : "")}>
      <span>{lbl}</span>
      <b className={neg ? "neg" : ""}>{val}</b>
    </div>
  );
}

export function railSummary(form: FormCode, data: FilingData, comp: CompResult): SumEntry[] {
  const P = peso;
  switch (form) {
    case "1701A": {
      const c = comp as Comp1701A;
      return [
        { lbl: "Tax rate", val: data.taxRate === "eight" ? "8% flat" : "Graduated + OSD" },
        { lbl: "Taxable income", val: P(data.taxRate === "eight" ? c.A.i55 : c.A.i45) },
        { lbl: "Tax due", val: P(c.A.i20) },
        { lbl: "Tax credits", val: P(c.A.i21) },
        { div: true },
        { big: true, lbl: "Amount payable", val: P(c.i30), neg: c.i30 < 0 },
      ];
    }
    case "1701": {
      const c = comp as Comp1701;
      return [
        { lbl: "Tax rate", val: data.rateA === "eight" ? "8% + graduated" : "Graduated" },
        { lbl: "Taxable income", val: P(c.A.taxableTotal) },
        { lbl: "Tax due", val: P(c.A.taxDue) },
        { lbl: "Tax credits", val: P(c.A.credits) },
        { div: true },
        { big: true, lbl: "Amount payable", val: P(c.aggregate), neg: c.aggregate < 0 },
      ];
    }
    case "1701Q": {
      const c = comp as Comp1701Q;
      return [
        { lbl: "Quarter", val: (data.quarter as string) || "—" },
        { lbl: "Taxable income", val: P(c.A.taxableCum) },
        { lbl: "Tax due", val: P(c.A.taxDue) },
        { lbl: "Credits", val: P(c.A.credits) },
        { div: true },
        { big: true, lbl: "Amount payable", val: P(c.aggregate), neg: c.aggregate < 0 },
      ];
    }
    case "1702RT": {
      const c = comp as Comp1702RT;
      return [
        { lbl: "Method", val: data.method === "osd" ? "OSD 40%" : "Itemized" },
        { lbl: "Net taxable income", val: P(c.i39) },
        { lbl: "Normal tax", val: P(c.i41) },
        { lbl: "MCIT 2%", val: P(c.i42) },
        { lbl: "Tax due", val: P(c.i43) + (c.mcitApplies ? " (MCIT)" : "") },
        { div: true },
        { big: true, lbl: "Amount payable", val: P(c.i21), neg: c.i21 < 0 },
      ];
    }
    case "1702Q": {
      const c = comp as Comp1702Q;
      return [
        { lbl: "Quarter", val: (data.quarter as string) || "—" },
        { lbl: "Taxable income", val: P(c.s2_9) },
        { lbl: "Normal tax", val: P(c.s2_11) },
        { lbl: "MCIT 2%", val: P(c.mcit) },
        { lbl: "Income tax due", val: P(c.s2_13) + (c.mcitApplies ? " (MCIT)" : "") },
        { div: true },
        { big: true, lbl: "Amount payable", val: P(c.i25), neg: c.i25 < 0 },
      ];
    }
    case "2550Q": {
      const c = comp as Comp2550Q;
      return [
        { lbl: "VATable sales", val: P(c.i31a) },
        { lbl: "Output tax (12%)", val: P(c.i34b) },
        { lbl: "Allowable input tax", val: P(c.i60) },
        { div: true },
        { big: true, lbl: "Total payable", val: P(c.i26), neg: c.i26 < 0 },
      ];
    }
    case "2551Q": {
      const c = comp as Comp2551Q;
      return [
        { lbl: "Total tax due", val: P(c.i14) },
        { lbl: "Credits", val: P(c.i18) },
        { div: true },
        { big: true, lbl: "Total payable", val: P(c.i24), neg: c.i24 < 0 },
      ];
    }
    case "2307": {
      const c = comp as Comp2307;
      return [
        { lbl: "Total income payments", val: P(c.totalIncome) },
        { div: true },
        { big: true, lbl: "Total tax withheld", val: P(c.totalTax) },
      ];
    }
    case "2316": {
      const c = comp as Comp2316;
      return [
        { lbl: "Gross taxable income", val: P(c.i23) },
        { lbl: "Tax due", val: P(c.i24) },
        { div: true },
        { big: true, lbl: "Total taxes withheld", val: P(c.i28) },
      ];
    }
  }
}

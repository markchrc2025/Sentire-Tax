import { describe, expect, it } from "vitest";
import type { FilingData } from "../../../types";
import {
  computeFor,
  compute1701A,
  compute1701,
  compute1701Q,
  compute1702RT,
  compute1702Q,
  compute2550Q,
  compute2551Q,
  compute2307,
  compute2316,
} from "../index";

describe("compute1701A — graduated + OSD path", () => {
  // ₱1,000,000 gross, 40% OSD → ₱600,000 taxable; 2024 (Table 2)
  const c = compute1701A({ taxRate: "graduated", year: "2024", i36A: "1000000" });
  it("applies OSD 40% of net sales", () => {
    expect(c.A.i38).toBe(1000000); // net sales
    expect(c.A.i39).toBe(400000); // OSD
    expect(c.A.i40).toBe(600000); // net income
    expect(c.A.i45).toBe(600000); // total taxable
  });
  it("computes graduated tax due (Item 46)", () => {
    expect(c.A.i46).toBe(62500); // 22,500 + 200,000*20%
    expect(c.A.taxDue).toBe(62500);
    expect(c.A.i20).toBe(62500);
  });
  it("rolls up to aggregate amount payable (Item 30)", () => {
    expect(c.A.i29).toBe(62500);
    expect(c.B.i29).toBe(0);
    expect(c.i30).toBe(62500);
  });
});

describe("compute1701A — 8% flat path", () => {
  // ₱1,000,000 gross, less ₱250,000 relief → ₱750,000 @ 8%
  const c = compute1701A({ taxRate: "eight", year: "2024", i47A: "1000000" });
  it("deducts the ₱250,000 relief then applies 8%", () => {
    expect(c.A.i49).toBe(1000000); // net sales
    expect(c.A.i53).toBe(1000000); // total taxable
    expect(c.A.i54).toBe(250000); // relief
    expect(c.A.i55).toBe(750000); // taxable income
    expect(c.A.i56).toBe(60000); // 750,000 * 8%
  });
  it("selects the 8% tax due", () => {
    expect(c.A.taxDue).toBe(60000);
    expect(c.i30).toBe(60000);
  });
});

describe("compute1701A — credits & net payable", () => {
  const c = compute1701A({
    taxRate: "graduated",
    year: "2024",
    i36A: "1000000",
    i58A: "20000", // quarterly payments
    i59A: "12500", // CWT
  });
  it("sums credits and nets them off tax due", () => {
    expect(c.A.i64).toBe(32500); // total credits
    expect(c.A.i65).toBe(62500 - 32500); // 30,000 net
    expect(c.A.i22).toBe(30000);
    expect(c.i30).toBe(30000);
  });
});

describe("compute1701 — mixed income", () => {
  it("graduated: comp + net business taxed together", () => {
    const c = compute1701({
      year: "2024",
      compA: "500000",
      salesA: "1000000",
      methodA: "osd",
      rateA: "graduated",
    });
    expect(c.A.deductions).toBe(400000); // OSD 40%
    expect(c.A.netBizTotal).toBe(600000);
    expect(c.A.taxableTotal).toBe(1100000);
    expect(c.A.taxDue).toBe(177500); // grad(1.1M, 2024) = 102.5k + 300k*25%
  });
  it("8%: graduated on comp + 8% on business", () => {
    const c = compute1701({ year: "2024", compA: "500000", salesA: "1000000", rateA: "eight" });
    expect(c.A.taxable8).toBe(750000);
    expect(c.A.tax8biz).toBe(60000);
    expect(c.A.taxDue).toBe(42500 + 60000); // grad(500k)=42,500 + 60,000
  });
});

describe("compute1701Q — quarterly individual", () => {
  it("graduated cumulative with OSD", () => {
    const c = compute1701Q({
      year: "2024",
      quarter: "Q1",
      salesA: "500000",
      methodA: "osd",
      rateA: "graduated",
    });
    expect(c.A.deductions).toBe(200000);
    expect(c.A.taxableCum).toBe(300000);
    expect(c.A.gradTax).toBe(7500); // (300k-250k)*15%
    expect(c.A.taxDue).toBe(7500);
  });
  it("8% with ₱250k relief on the filer column only", () => {
    const c = compute1701Q({ year: "2024", salesA: "500000", rateA: "eight" });
    expect(c.A.reduce8).toBe(250000);
    expect(c.A.taxable8).toBe(250000);
    expect(c.A.tax8).toBe(20000);
    expect(c.A.taxDue).toBe(20000);
  });
});

describe("compute1702RT — corporate, MCIT-aware", () => {
  it("uses the normal rate when it exceeds MCIT", () => {
    const c = compute1702RT({ i27: "2000000", i30: "1000000", method: "itemized", i34: "200000" });
    expect(c.rate).toBe(25); // default regular rate
    expect(c.i33).toBe(1000000); // gross income
    expect(c.i39).toBe(800000); // net taxable (itemized)
    expect(c.i41).toBe(200000); // normal tax 25%
    expect(c.i42).toBe(20000); // MCIT 2% of gross
    expect(c.i43).toBe(200000); // higher of the two
    expect(c.mcitApplies).toBe(false);
    expect(c.i21).toBe(200000); // total payable
  });
  it("uses MCIT when 2% of gross exceeds the normal tax", () => {
    const c = compute1702RT({ i27: "1000000", i30: "0", method: "itemized", i34: "980000" });
    expect(c.i39).toBe(20000); // net taxable after big deductions
    expect(c.i41).toBe(5000); // normal 25%
    expect(c.i42).toBe(20000); // MCIT 2% of 1M gross
    expect(c.i43).toBe(20000);
    expect(c.mcitApplies).toBe(true);
  });
  it("OSD = 40% of gross income for corporations", () => {
    const c = compute1702RT({ i27: "1000000", i30: "0", method: "osd" });
    expect(c.i33).toBe(1000000);
    expect(c.i38).toBe(400000); // OSD 40% of gross income
    expect(c.i39).toBe(600000); // net taxable
  });
});

describe("compute1702Q — quarterly corporate", () => {
  it("computes normal vs MCIT, picks higher", () => {
    const c = compute1702Q({ s2_1: "2000000", s2_2: "1000000", method: "itemized", s2_6: "200000" });
    expect(c.s2_5).toBe(1000000); // total gross income
    expect(c.s2_9).toBe(800000); // taxable to date
    expect(c.s2_11).toBe(200000); // normal 25%
    expect(c.mcit).toBe(20000); // MCIT 2%
    expect(c.s2_13).toBe(200000);
    expect(c.i14).toBe(200000);
  });
});

describe("compute2550Q — quarterly VAT", () => {
  it("output tax = 12% of VATable sales; net of allowable input", () => {
    const c = compute2550Q({ i31a: "1000000", i44b: "50000" });
    expect(c.i31b).toBe(120000); // 12% output
    expect(c.i34b).toBe(120000);
    expect(c.i37).toBe(120000); // adjusted output
    expect(c.i60).toBe(50000); // allowable input
    expect(c.i61).toBe(70000); // net VAT payable
    expect(c.i26).toBe(70000); // total payable
  });
});

describe("compute2551Q — quarterly percentage tax", () => {
  it("sums per-line taxable × ATC rate", () => {
    const data: FilingData = {
      rows: [
        { atc: "PT010", taxable: "500000", rate: "3" },
        { atc: "PT040", taxable: "200000", rate: "1" },
      ],
    };
    const c = compute2551Q(data);
    expect(c.rows[0].due).toBe(15000); // 500k * 3%
    expect(c.rows[1].due).toBe(2000); // 200k * 1%
    expect(c.i14).toBe(17000); // total tax due
    expect(c.i24).toBe(17000); // total payable
  });
});

describe("compute2307 — creditable tax withheld", () => {
  it("totals monthly income payments and tax", () => {
    const data: FilingData = {
      rows: [
        { atc: "WI010", m1: "100000", m2: "100000", m3: "100000", tax: "15000" },
        { atc: "WI020", m1: "50000", m2: "0", m3: "0", tax: "2500" },
      ],
    };
    const c = compute2307(data);
    expect(c.rows[0].total).toBe(300000);
    expect(c.rows[1].total).toBe(50000);
    expect(c.totalIncome).toBe(350000);
    expect(c.totalTax).toBe(17500);
    expect(c.tM1).toBe(150000);
  });
});

describe("compute2316 — compensation certificate", () => {
  it("graduated tax on gross taxable compensation", () => {
    const c = compute2316({ year: "2024", i39: "500000", i29: "90000" });
    expect(c.i38).toBe(90000); // non-taxable (item 38)
    expect(c.i52).toBe(500000); // total taxable comp, present (item 52)
    expect(c.i23).toBe(500000); // gross taxable comp (item 23)
    expect(c.i24).toBe(42500); // grad(500k, 2024)
  });
});

describe("computeFor — dispatcher", () => {
  it("routes each form code to its engine", () => {
    expect(computeFor("1701A", { taxRate: "eight", year: "2024", i47A: "1000000" }).A.i56).toBe(60000);
    expect(computeFor("1702RT", { i27: "1000000", i30: "0", method: "osd" }).i38).toBe(400000);
    expect(computeFor("2550Q", { i31a: "1000000" }).i31b).toBe(120000);
  });
});

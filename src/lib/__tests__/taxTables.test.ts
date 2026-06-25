import { describe, expect, it } from "vitest";
import { graduatedTax, TAX_TABLE_1, TAX_TABLE_2 } from "../taxTables";

describe("graduatedTax — TRAIN Table 1 (2018–2022)", () => {
  it("is zero up to ₱250,000", () => {
    expect(graduatedTax(250000, 2020)).toBe(0);
    expect(graduatedTax(0, 2020)).toBe(0);
    expect(graduatedTax(-5, 2020)).toBe(0);
  });
  it("locks the bracket boundaries", () => {
    expect(graduatedTax(400000, 2020)).toBe(30000); // (400k-250k)*20%
    expect(graduatedTax(500000, 2020)).toBe(55000); // 30k + (500k-400k)*25%
    expect(graduatedTax(800000, 2020)).toBe(130000); // 30k + (800k-400k)*25%
    expect(graduatedTax(2000000, 2020)).toBe(490000); // 130k + 1.2M*30%
    expect(graduatedTax(8000000, 2020)).toBe(2410000); // 490k + 6M*32%
    expect(graduatedTax(10000000, 2020)).toBe(3110000); // 2.41M + 2M*35%
  });
});

describe("graduatedTax — TRAIN Table 2 (2023 onward)", () => {
  it("applies the lower 2023+ rates", () => {
    expect(graduatedTax(250000, 2024)).toBe(0);
    expect(graduatedTax(400000, 2024)).toBe(22500); // (400k-250k)*15%
    expect(graduatedTax(500000, 2024)).toBe(42500); // 22.5k + 100k*20%
    expect(graduatedTax(800000, 2024)).toBe(102500); // 22.5k + 400k*20%
    expect(graduatedTax(2000000, 2024)).toBe(402500); // 102.5k + 1.2M*25%
    expect(graduatedTax(8000000, 2024)).toBe(2202500); // 402.5k + 6M*30%
    expect(graduatedTax(10000000, 2024)).toBe(2902500); // 2.2025M + 2M*35%
  });
});

describe("graduatedTax — table selection by year", () => {
  it("switches tables exactly at 2023", () => {
    expect(graduatedTax(300000, 2022)).toBe(10000); // table 1: 50k*20%
    expect(graduatedTax(300000, 2023)).toBe(7500); // table 2: 50k*15%
  });
  it("accepts string years (slice of the period)", () => {
    expect(graduatedTax(300000, "2022")).toBe(10000);
    expect(graduatedTax(300000, "2024")).toBe(7500);
  });
});

describe("table shape", () => {
  it("has six brackets each, top open-ended", () => {
    expect(TAX_TABLE_1).toHaveLength(6);
    expect(TAX_TABLE_2).toHaveLength(6);
    expect(TAX_TABLE_1[5].upTo).toBe(Infinity);
    expect(TAX_TABLE_2[5].upTo).toBe(Infinity);
  });
});

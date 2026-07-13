import { describe, expect, it } from "vitest";
import { fmtAmt, fmtDate, num, peso, roundPeso } from "../format";

describe("num", () => {
  it("parses numbers, strips commas, treats blanks as 0", () => {
    expect(num("1,234")).toBe(1234);
    expect(num("1,234,567.5")).toBe(1234567.5);
    expect(num("")).toBe(0);
    expect(num(null)).toBe(0);
    expect(num(undefined)).toBe(0);
    expect(num("abc")).toBe(0);
    expect(num(42)).toBe(42);
    expect(num("12.50")).toBe(12.5);
  });
});

describe("roundPeso (49c down / 50c up, symmetric)", () => {
  it("rounds at the half-peso boundary", () => {
    expect(roundPeso(0.49)).toBe(0);
    expect(roundPeso(0.5)).toBe(1);
    expect(roundPeso(1.49)).toBe(1);
    expect(roundPeso(1.5)).toBe(2);
    expect(roundPeso(123.49)).toBe(123);
    expect(roundPeso(123.5)).toBe(124);
  });
  it("is symmetric for negatives", () => {
    expect(roundPeso(-0.49)).toBe(-0);
    expect(roundPeso(-0.5)).toBe(-1);
    expect(roundPeso(-123.5)).toBe(-124);
  });
  it("guards NaN", () => {
    expect(roundPeso(NaN)).toBe(0);
  });
});

describe("fmtAmt", () => {
  it("formats with thousands separators, no centavos", () => {
    expect(fmtAmt(1234567)).toBe("1,234,567");
    expect(fmtAmt(1000)).toBe("1,000");
    expect(fmtAmt(0)).toBe("0");
  });
  it("rounds via roundPeso by default", () => {
    expect(fmtAmt(1234.5)).toBe("1,235");
    expect(fmtAmt(1234.49)).toBe("1,234");
  });
  it("wraps negatives in parentheses", () => {
    expect(fmtAmt(-1234)).toBe("(1,234)");
  });
  it("renders empty/invalid as empty string", () => {
    expect(fmtAmt("")).toBe("");
    expect(fmtAmt(null)).toBe("");
    expect(fmtAmt(undefined)).toBe("");
  });
  it("honors dec + noRound", () => {
    expect(fmtAmt(1234.5, { dec: 2, noRound: true })).toBe("1,234.50");
  });
});

describe("peso", () => {
  it("prefixes the peso sign", () => {
    expect(peso(1234)).toBe("₱ 1,234");
    expect(peso(-1234)).toBe("₱ (1,234)");
  });
});

describe("fmtDate — ISO date → MM/DD/YYYY (printed BIR format)", () => {
  it("reformats ISO dates from the date inputs", () => {
    expect(fmtDate("1967-05-18")).toBe("05/18/1967");
    expect(fmtDate("1983-09-18")).toBe("09/18/1983");
  });
  it("passes through empty and non-ISO values", () => {
    expect(fmtDate("")).toBe("");
    expect(fmtDate(null)).toBe("");
    expect(fmtDate(undefined)).toBe("");
    expect(fmtDate("05/18/1967")).toBe("05/18/1967");
  });
});

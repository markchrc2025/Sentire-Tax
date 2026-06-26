import { describe, expect, it } from "vitest";
import type { FilingData, FormCode, Taxpayer } from "../../../types";
import { computeFor } from "../../../lib/compute";
import { validateFor, type ValidationContext, type ValidationItem } from "../validators";

function tp(over: Partial<Taxpayer> = {}): Taxpayer {
  return {
    id: "tp1",
    kind: "individual",
    regName: "",
    lastName: "DELA CRUZ",
    firstName: "JUAN",
    middleName: "SANTOS",
    tin: "474079835",
    branch: "00000",
    rdo: "050",
    address: "1 MABINI ST",
    city: "MANILA",
    zip: "1000",
    birthdate: "1990-01-15",
    email: "juan@example.com",
    phone: "09171234567",
    citizenship: "FILIPINO",
    civilStatus: "single",
    taxpayerType: "single",
    classification: "Small",
    createdAt: 0,
    ...over,
  };
}

/** Run a form's validators against data + an optional period/taxpayer. */
function run(form: FormCode, data: FilingData, ctx?: Partial<ValidationContext>): ValidationItem[] {
  const comp = computeFor(form, data);
  const full: ValidationContext = { tp: ctx?.tp ?? tp(), period: ctx?.period ?? String(data.year ?? "") };
  return validateFor(form, data, comp, full);
}

const msgs = (items: ValidationItem[]) => items.map((i) => i.msg).join(" | ");
const has = (items: ValidationItem[], level: ValidationItem["level"], rx: RegExp) =>
  items.some((i) => i.level === level && rx.test(i.msg));

describe("required-field safeguards fire for every form", () => {
  const FORMS: FormCode[] = ["1701", "1701A", "1701Q", "1702RT", "1702Q", "2550Q", "2551Q", "2307", "2316"];
  it("each form returns at least one item and flags a missing TIN as an error", () => {
    for (const form of FORMS) {
      const items = run(form, { year: "2024" }, { tp: tp({ tin: "" }), period: "2024-Q1" });
      expect(items.length, form).toBeGreaterThan(0);
      expect(has(items, "error", /TIN/i), `${form}: ${msgs(items)}`).toBe(true);
    }
  });
});

describe("1701A — 8% eligibility and installment rules", () => {
  it("blocks the 8% rate once the taxable base exceeds ₱3M", () => {
    const items = run("1701A", { year: "2024", taxRate: "eight", atc: "II015", i47A: "4000000" });
    expect(has(items, "error", /8% rate unavailable/)).toBe(true);
  });
  it("allows the 8% rate under ₱3M", () => {
    const items = run("1701A", { year: "2024", taxRate: "eight", atc: "II015", i47A: "1000000" });
    expect(has(items, "error", /8% rate unavailable/)).toBe(false);
  });
  it("warns when the 2nd installment exceeds 50% of the tax due", () => {
    // graduated tax on 2M net income is well above 0; ask for a huge installment
    const items = run("1701A", { year: "2024", taxRate: "graduated", atc: "II012", i36A: "3000000", i23A: "900000" });
    expect(has(items, "warn", /2nd installment/)).toBe(true);
  });
});

describe("1701A — conditional Part I fields", () => {
  it("warns for a missing Foreign Tax Number when foreign credits are claimed (Item 13/14)", () => {
    const items = run("1701A", { year: "2024", taxRate: "graduated", atc: "II012", foreignCredit: "yes" });
    expect(has(items, "warn", /Foreign Tax Number/)).toBe(true);
  });
  it("does not warn once the Foreign Tax Number is supplied", () => {
    const items = run("1701A", {
      year: "2024",
      taxRate: "graduated",
      atc: "II012",
      foreignCredit: "yes",
      foreignTaxNo: "FT-12345",
    });
    expect(has(items, "warn", /Foreign Tax Number/)).toBe(false);
  });
  it("warns a married filer to choose a filing status (Item 18)", () => {
    const items = run("1701A", { year: "2024", taxRate: "graduated", atc: "II012", civil: "married" });
    expect(has(items, "warn", /filing status/i)).toBe(true);
  });
});

describe("1701Q — quarter and 8% rules", () => {
  it("warns that there is no 4th-quarter 1701Q", () => {
    const items = run("1701Q", { year: "2024" }, { period: "2024-Q4" });
    expect(has(items, "warn", /1st–3rd quarters only|no .*4th/i)).toBe(true);
  });
  it("errors when no quarter is set", () => {
    const items = run("1701Q", { year: "2024" }, { period: "2024" });
    expect(has(items, "error", /quarter/i)).toBe(true);
  });
});

describe("1702RT — corporate regular rate", () => {
  it("blocks the 20% rate when net taxable income exceeds ₱5M", () => {
    const items = run("1702RT", { year: "2024", rate: "20", method: "osd", i27: "20000000", i30: "5000000" });
    expect(has(items, "error", /20% rate requires net taxable income/)).toBe(true);
  });
  it("accepts the standard 25% rate without a rate warning", () => {
    const items = run("1702RT", { year: "2024", rate: "25", method: "osd", i27: "1000000" });
    expect(has(items, "warn", /regular rate is usually/i)).toBe(false);
  });
});

describe("2551Q — percentage-tax ATC and time-bound Section 116 rate", () => {
  it("flags a row whose rate doesn't match the ATC", () => {
    const items = run("2551Q", { year: "2024", rows: [{ atc: "PT010", taxable: "100000", rate: "1" }] }, { period: "2024-Q1" });
    // Section 116 is 3% from 7/1/2023 onward, so a 1% entry for 2024 is wrong
    expect(has(items, "error", /PT010 rate should be 3%/)).toBe(true);
  });
  it("accepts the 1% Section 116 rate during the CREATE relief window", () => {
    const items = run("2551Q", { year: "2022", rows: [{ atc: "PT010", taxable: "100000", rate: "1" }] }, { period: "2022-Q1" });
    expect(has(items, "error", /PT010 rate should be/)).toBe(false);
  });
  it("errors on an unknown ATC and a taxable line without an ATC", () => {
    const bad = run("2551Q", { year: "2024", rows: [{ atc: "ZZ999", taxable: "5000", rate: "3" }] }, { period: "2024-Q1" });
    expect(has(bad, "warn", /isn't a recognized/)).toBe(true);
    const noAtc = run("2551Q", { year: "2024", rows: [{ taxable: "5000" }] }, { period: "2024-Q1" });
    expect(has(noAtc, "error", /select an ATC/i)).toBe(true);
  });
});

describe("2307 — withholding certificate", () => {
  it("requires payor name and rejects payor == payee TIN", () => {
    const items = run("2307", {
      periodFrom: "01/01/2024",
      periodTo: "03/31/2024",
      payorTin: "474-079-835",
      rows: [{ atc: "WI010", m1: "100000", tax: "5000" }],
    });
    expect(has(items, "error", /payor's .*name/i)).toBe(true);
    expect(has(items, "error", /same/i)).toBe(true);
  });
  it("warns when tax withheld doesn't match the ATC rate", () => {
    const items = run("2307", {
      periodFrom: "01/01/2024",
      periodTo: "03/31/2024",
      payorName: "ACME CORP",
      payorTin: "123-456-789",
      rows: [{ atc: "WI010", m1: "100000", tax: "999" }], // 5% of 100k = 5,000
    });
    expect(has(items, "warn", /doesn't match 5%/)).toBe(true);
  });
  it("errors when tax withheld exceeds the income payment", () => {
    const items = run("2307", {
      periodFrom: "01/01/2024",
      periodTo: "03/31/2024",
      payorName: "ACME CORP",
      payorTin: "123-456-789",
      rows: [{ atc: "WI010", m1: "1000", tax: "5000" }],
    });
    expect(has(items, "error", /can't exceed the income/)).toBe(true);
  });
});

describe("2316 — compensation certificate", () => {
  it("errors when non-taxable 13th-month pay exceeds ₱90,000", () => {
    const items = run("2316", { year: "2024", empName: "ACME CORP", empTin: "123-456-789", i34: "120000" });
    expect(has(items, "error", /90,000/)).toBe(true);
  });
  it("passes a clean certificate with no errors", () => {
    const items = run("2316", { year: "2024", empName: "ACME CORP", empTin: "123-456-789", i34: "90000", i39: "500000", i25A: "40000" });
    expect(items.some((i) => i.level === "error"), msgs(items)).toBe(false);
  });
});

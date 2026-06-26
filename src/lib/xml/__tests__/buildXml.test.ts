import { describe, expect, it } from "vitest";
import type { Filing, FormCode, Taxpayer } from "../../../types";
import { computeFor } from "../../compute";
import { buildXml, xmlFileName, xmlSupported } from "../buildXml";

function tpWith(tin: string): Taxpayer {
  return {
    id: "tp1", kind: "individual", regName: "", lastName: "X", firstName: "Y", middleName: "",
    tin, branch: "00000", rdo: "045", address: "", city: "", zip: "", birthdate: "",
    email: "", phone: "", citizenship: "", civilStatus: "", taxpayerType: "", classification: "",
    createdAt: 0,
  };
}

const ALL_FORMS: FormCode[] = [
  "1701", "1701A", "1701Q", "1702RT", "1702Q", "2550Q", "2551Q", "2307", "2316",
];

function filing(form: FormCode, period: string, data: Filing["data"] = {}): Filing {
  return {
    id: "f1", form, taxpayerId: "tp1", status: "draft", period,
    data: { year: period.slice(0, 4), ...data }, createdAt: 0, updatedAt: 0,
  };
}

describe("xmlFileName — follows the eBIRForms naming convention per form", () => {
  const cases: Array<[FormCode, string, string, string]> = [
    ["1701", "218430523", "2025", "2184305230001701v2018122025.xml"],
    ["1701A", "179059021", "2025", "1790590210001701A122025.xml"],
    ["1701Q", "474079835", "2025-Q2", "4740798350001701Qv20182025Q2.xml"],
    ["1702RT", "683266552", "2025", "6832665520001702RTv2018122025.xml"],
    ["1702Q", "626027978", "2025-Q2", "6260279780001702Q2025Q2.xml"],
    ["2550Q", "010812973", "2026-Q1", "0108129730002550Qv2024122026Q1.xml"],
    ["2551Q", "652528538", "2026-Q1", "6525285380002551Qv2018122026Q1.xml"],
  ];
  cases.forEach(([form, tin, period, expected]) => {
    it(`${form} → ${expected}`, () => {
      expect(xmlFileName(form, filing(form, period), tpWith(tin))).toBe(expected);
    });
  });
});

describe("xmlSupported — 2307/2316 certificates have no eBIRForms XML", () => {
  it("returns false for the two certificates and true for the seven returns", () => {
    expect(xmlSupported("2307")).toBe(false);
    expect(xmlSupported("2316")).toBe(false);
    (["1701", "1701A", "1701Q", "1702RT", "1702Q", "2550Q", "2551Q"] as FormCode[]).forEach((f) =>
      expect(xmlSupported(f), f).toBe(true),
    );
  });
});

describe("buildXml — well-formed envelope for every form", () => {
  ALL_FORMS.forEach((form) => {
    it(`${form} starts with the XML header and ends with the BIR tail`, () => {
      const f = filing(form, "2024");
      const xml = buildXml(form, f, null, computeFor(form, f.data));
      expect(xml.startsWith("<?xml version='1.0'?>")).toBe(true);
      expect(xml).toContain("All Rights Reserved BIR");
      expect(xml).toContain("<div>");
      expect(xml).toContain("=</div>");
    });
  });
});

// Reconstructs the real eBIRForms 1701A sample (COMIA, MERLITO CASTILLO) and
// checks our output reproduces its authentic field keys and values.
describe("build1701A — matches the authentic eBIRForms 1701A export", () => {
  const tp: Taxpayer = {
    id: "tp1", kind: "individual", regName: "",
    lastName: "COMIA", firstName: "MERLITO", middleName: "CASTILLO",
    tin: "179059021", branch: "00000", rdo: "045",
    address: "127 JP RIZAL ST, SAN ROQUE", city: "MARIKINA CITY", zip: "1801",
    birthdate: "1967-05-18", email: "mcrc.business.solutions@gmail.com",
    phone: "09190660794", citizenship: "FILIPINO", civilStatus: "married",
    taxpayerType: "single", classification: "", createdAt: 0,
  };
  const f = filing("1701A", "2025", {
    year: "2025", amended: "no", shortPeriod: "no", taxpayerType: "single",
    atc: "II012", foreignCredit: "no", civil: "married", spouseIncome: "yes",
    filing: "separate", taxRate: "graduated", i36A: "201586",
  });
  const xml = buildXml("1701A", f, tp, computeFor("1701A", f.data));
  const has = (line: string) => expect(xml).toContain(`<div>${line}</div>`);

  it("uses the frm1701A namespace and authentic background keys", () => {
    has("frm1701A:txtMonth=12frm1701A:txtMonth=");
    has("frm1701A:txtYear=2025frm1701A:txtYear=");
    has("frm1701A:txtTIN1=179frm1701A:txtTIN1=");
    has("frm1701A:txtTIN2=059frm1701A:txtTIN2=");
    has("frm1701A:txtTIN3=021frm1701A:txtTIN3=");
    has("frm1701A:txtBranchCode=000frm1701A:txtBranchCode=");
    has("frm1701A:txtRDOCode=045frm1701A:txtRDOCode=");
    has("frm1701A:txtTaxpayerName=COMIA%2C%20MERLITO%20CASTILLOfrm1701A:txtTaxpayerName=");
    has("frm1701A:txtBirthDate=05/18/1967frm1701A:txtBirthDate=");
    // email is a global (un-namespaced) field
    has("txtEmail=mcrc.business.solutions@gmail.comtxtEmail=");
  });

  it("maps the radio/checkbox selections", () => {
    has("frm1701A:optAmendedReturn_2=truefrm1701A:optAmendedReturn_2=");
    has("frm1701A:optTaxType_1=truefrm1701A:optTaxType_1=");
    has("frm1701A:optATC_1=truefrm1701A:optATC_1=");
    has("frm1701A:optCivilStatus_2=truefrm1701A:optCivilStatus_2=");
    has("frm1701A:optSpouseIncome_1=truefrm1701A:optSpouseIncome_1=");
    has("frm1701A:optFilingStatus_2=truefrm1701A:optFilingStatus_2=");
    has("frm1701A:optTaxRate_1=truefrm1701A:optTaxRate_1=");
  });

  it("reproduces the Part IV computed amounts exactly", () => {
    has("frm1701A:txt36A=201,586.00frm1701A:txt36A=");
    has("frm1701A:txt39A=80,634.00frm1701A:txt39A=");
    has("frm1701A:txt40A=120,952.00frm1701A:txt40A=");
    has("frm1701A:txt45A=120,952.00frm1701A:txt45A=");
    has("frm1701A:txt46A=0.00frm1701A:txt46A=");
  });

  it("ends with the 1701A package tail (BIR 2014.)", () => {
    has("frm1701A:txtVersion=11112018frm1701A:txtVersion=");
    expect(xml.trimEnd().endsWith("All Rights Reserved BIR 2014.")).toBe(true);
  });

  it("produces the authentic filename", () => {
    expect(xmlFileName("1701A", f, tp)).toBe("1790590210001701A122025.xml");
  });
});

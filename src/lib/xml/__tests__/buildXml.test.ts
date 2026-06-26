import { describe, expect, it } from "vitest";
import type { Filing, FormCode, Taxpayer } from "../../../types";
import { computeFor } from "../../compute";
import { buildXml, xmlFileName } from "../buildXml";

const ALL_FORMS: FormCode[] = [
  "1701", "1701A", "1701Q", "1702RT", "1702Q", "2550Q", "2551Q", "2307", "2316",
];

function filing(form: FormCode, period: string, data: Filing["data"] = {}): Filing {
  return {
    id: "f1", form, taxpayerId: "tp1", status: "draft", period,
    data: { year: period.slice(0, 4), ...data }, createdAt: 0, updatedAt: 0,
  };
}

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

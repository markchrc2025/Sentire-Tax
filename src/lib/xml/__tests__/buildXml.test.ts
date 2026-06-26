import { describe, expect, it } from "vitest";
import type { Filing, FormCode, Taxpayer } from "../../../types";
import { computeFor } from "../../compute";
import { buildXml, xmlFileName } from "../buildXml";

const ALL_FORMS: FormCode[] = [
  "1701",
  "1701A",
  "1701Q",
  "1702RT",
  "1702Q",
  "2550Q",
  "2551Q",
  "2307",
  "2316",
];

function tp(): Taxpayer {
  return {
    id: "tp1",
    kind: "individual",
    regName: "",
    lastName: "Dela Cruz",
    firstName: "Juan",
    middleName: "Santos",
    tin: "474079835",
    branch: "00000",
    rdo: "050",
    address: "1 Mabini St",
    city: "Manila",
    zip: "1000",
    birthdate: "1990-01-15",
    email: "juan@example.com",
    phone: "09171234567",
    citizenship: "Filipino",
    civilStatus: "single",
    taxpayerType: "single",
    classification: "",
    createdAt: 0,
  };
}

function filing(form: FormCode, period: string, data: Filing["data"] = {}): Filing {
  return {
    id: "f1",
    form,
    taxpayerId: "tp1",
    status: "draft",
    period,
    data: { year: period.slice(0, 4), ...data },
    createdAt: 0,
    updatedAt: 0,
  };
}

describe("buildXml — well-formed for every form", () => {
  ALL_FORMS.forEach((form) => {
    it(`${form} produces a complete eBIRForms-style envelope`, () => {
      const f = filing(form, "2024");
      const comp = computeFor(form, f.data);
      const xml = buildXml(form, f, tp(), comp);
      expect(xml.startsWith("<?xml version='1.0'?>")).toBe(true);
      expect(xml.trimEnd().endsWith("All Rights Reserved BIR 2012.0")).toBe(true);
      // every emitted field is a balanced <div>KEY=VALUEKEY=</div> block
      expect(xml).toContain("<div>");
      expect(xml).toContain("=</div>");
    });
  });
});

describe("buildXml — 1701A stays in the official field format", () => {
  it("uses the frm1701A namespace and official TIN keys", () => {
    const f = filing("1701A", "2024");
    const comp = computeFor("1701A", f.data);
    const xml = buildXml("1701A", f, tp(), comp);
    expect(xml).toContain("frm1701A:txtPg1I4TIN1=474");
    expect(xml).toContain("frm1701A:txtPg1I4BranchCode=");
  });
});

describe("buildXml — generic builder carries background, inputs, and computed values", () => {
  it("emits taxpayer background and the parsed quarter", () => {
    const f = filing("1701Q", "2024-Q2", { salesA: "500000", methodA: "osd" });
    const comp = computeFor("1701Q", f.data);
    const xml = buildXml("1701Q", f, tp(), comp);
    expect(xml).toContain("frm1701Q:FormType=1701Q");
    expect(xml).toContain("frm1701Q:Quarter=Q2");
    expect(xml).toContain("frm1701Q:TIN1=474");
    // a raw user input field is preserved
    expect(xml).toContain("frm1701Q:data_salesA=500000");
    // a computed amount is flattened in with peso formatting
    expect(xml).toContain("frm1701Q:comp_A_netSales=500,000.00");
  });

  it("flattens 2307 repeating rows", () => {
    const f = filing("2307", "2024", {
      rows: [{ atc: "WI010", desc: "Rent", m3: "12000", tax: "600" }],
    });
    const comp = computeFor("2307", f.data);
    const xml = buildXml("2307", f, tp(), comp);
    expect(xml).toContain("frm2307:row1_atc=WI010");
    expect(xml).toContain("frm2307:row1_tax=600");
  });
});

describe("xmlFileName", () => {
  it("matches the official 1701A package name", () => {
    const f = filing("1701A", "2024");
    expect(xmlFileName("1701A", f, tp())).toBe("474079835000-1701Av2018-122024.xml");
  });

  it("includes the quarter for quarterly returns", () => {
    const f = filing("2551Q", "2024-Q3");
    expect(xmlFileName("2551Q", f, tp())).toBe("474079835000-2551Q-2024Q3.xml");
  });

  it("uses the plain year for annual returns", () => {
    const f = filing("1701", "2024");
    expect(xmlFileName("1701", f, tp())).toBe("474079835000-1701-2024.xml");
  });
});

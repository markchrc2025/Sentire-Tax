import { describe, expect, it } from "vitest";
import {
  buildFilingPushback,
  portalClientToTaxpayer,
  suggestedForm,
  vatSummaryToFilingData,
} from "../mapping";
import type { PortalClient, PortalVatSummary } from "../types";

const SUMMARY: PortalVatSummary = {
  client: { id: "cl_123", tin: "471522378", vatRegistered: true },
  period: { year: 2026, quarter: 1, start: "2026-01-01", end: "2026-03-31" },
  sales: {
    vatable: { net: 400000, outputVAT: 48000 },
    zeroRated: { net: 0 },
    exempt: { net: 0 },
    governmentSalesMemo: { net: 100000, creditableVATWithheld5pct: 5000 },
  },
  purchases: {
    domesticPurchases: { net: 300000, inputVAT: 36000 },
    servicesNonResident: { net: 0, inputVAT: 0 },
    importationGoods: { net: 0, inputVAT: 0 },
    othersWithInputTax: { net: 0, inputVAT: 0 },
    domesticNoInputTax: { net: 0 },
    vatExemptImportation: { net: 0 },
    capitalGoodsGT1M: {
      items: [
        { acquiredOn: "2026-02-10", cost: 1500000, inputVAT: 180000, usefulLifeMonths: 60 },
      ],
    },
  },
  exemptInputTax: { directlyAttributable: 0, commonNotDirectlyAttributable: 0 },
  otherCredits: { creditableVATWithheld: 5000, advanceVATPayments: 0 },
};

describe("vatSummaryToFilingData", () => {
  it("maps the spec's worked example onto 2550Q field ids", () => {
    const d = vatSummaryToFilingData(SUMMARY);
    expect(d.i31a).toBe("400000"); // Item 31A vatable sales
    expect(d.i44a).toBe("300000"); // Item 44A domestic purchases
    expect(d.i44b).toBe("36000"); // Item 44B input VAT
    expect(d.i16).toBe("5000"); // Item 16 creditable VAT withheld (single total)
    expect(d.year).toBe("2026");
    expect(d.quarter).toBe("1");
  });

  it("never pre-fills Item 31B (the engine derives 12% × net)", () => {
    const d = vatSummaryToFilingData(SUMMARY);
    expect(d.i31b).toBeUndefined();
  });

  it("does not roll capital goods > 1M into Items 44–49", () => {
    const d = vatSummaryToFilingData(SUMMARY);
    // domesticPurchases stays 300000 — the 1.5M capital good is Schedule 1 only
    expect(d.i44a).toBe("300000");
  });

  it("omits zero-valued lines for a clean pre-fill", () => {
    const d = vatSummaryToFilingData(SUMMARY);
    expect(d.i32a).toBeUndefined();
    expect(d.i45a).toBeUndefined();
    expect(d.i17).toBeUndefined();
  });

  it("maps Schedule 2 exempt input tax pools", () => {
    const d = vatSummaryToFilingData({
      ...SUMMARY,
      exemptInputTax: { directlyAttributable: 1200, commonNotDirectlyAttributable: 800 },
    });
    expect(d.sch2_direct).toBe("1200");
    expect(d.sch2_ratable).toBe("800");
  });
});

describe("portalClientToTaxpayer", () => {
  const client: PortalClient = {
    id: "cl_123",
    businessName: "Acme Trading Corp",
    tin: "471-522-378-000",
    address: "123 Ayala Ave, Makati",
    taxType: "VAT",
    fiscalYearStart: "2026-01-01",
    currency: "PHP",
  };

  it("maps business name, normalizes TIN, and seeds a VAT tax type", () => {
    const t = portalClientToTaxpayer(client);
    expect(t.regName).toBe("Acme Trading Corp");
    expect(t.tin).toBe("471522378"); // 9 digits, separators stripped
    expect(t.branch).toBe("00000");
    expect(t.taxTypes?.[0]).toMatchObject({ type: "VAT", form: "2550Q" });
  });

  it("suggests 2550Q for VAT and 2551Q otherwise", () => {
    expect(suggestedForm(client)).toBe("2550Q");
    expect(suggestedForm({ ...client, taxType: "Percentage Tax" })).toBe("2551Q");
  });

  it("carries the full filer profile when the Portal provides it", () => {
    const full: PortalClient = {
      ...client,
      kind: "non-individual",
      regName: "Acme Trading Corporation",
      tradeName: "Acme",
      branch: "00001",
      rdo: "050",
      rdoName: "Makati West",
      city: "Makati",
      zip: "1226",
      incorpDate: "2019-05-10T00:00:00.000Z",
      email: "ops@acme.example",
      phone: "+63 2 8888 0000",
      citizenship: "Filipino",
      taxpayerType: "Corporation",
      classification: "Large",
      taxTypesJson: [
        { type: "Value-Added Tax", form: "2550Q", frequency: "Quarterly", startDate: "2019-05-10T00:00:00.000Z" },
        { type: "Income Tax", form: "1702RT", frequency: "Annually" },
      ],
    };
    const t = portalClientToTaxpayer(full);
    expect(t.regName).toBe("Acme Trading Corporation"); // uses regName, not businessName
    expect(t.branch).toBe("00001");
    expect(t.rdo).toBe("050");
    expect(t.rdoName).toBe("Makati West");
    expect(t.city).toBe("Makati");
    expect(t.incorpDate).toBe("2019-05-10"); // ISO datetime → yyyy-mm-dd
    expect(t.classification).toBe("Large");
    expect(t.taxTypes).toHaveLength(2);
    expect(t.taxTypes?.[0]).toMatchObject({ type: "Value-Added Tax", form: "2550Q" });
    expect(t.taxTypes?.[0].startDate).toBe("2019-05-10");
  });

  it("maps an individual filer's name fields and kind", () => {
    const indiv: PortalClient = {
      ...client,
      kind: "individual",
      regName: null,
      businessName: "Juan Dela Cruz",
      lastName: "Dela Cruz",
      firstName: "Juan",
      middleName: "Santos",
      birthdate: "1990-03-15T00:00:00.000Z",
      civilStatus: "Single",
      taxType: "Percentage Tax",
    };
    const t = portalClientToTaxpayer(indiv);
    expect(t.kind).toBe("individual");
    expect(t.lastName).toBe("Dela Cruz");
    expect(t.firstName).toBe("Juan");
    expect(t.birthdate).toBe("1990-03-15");
    expect(t.civilStatus).toBe("Single");
  });
});

describe("buildFilingPushback", () => {
  it("computes the quarter period and carries the artifact", () => {
    const p = buildFilingPushback({
      form: "2550Q",
      year: 2026,
      quarter: 1,
      status: "filed",
      figures: { netVATPayable: -12000 },
      xmlFilename: "x.xml",
      xmlBase64: "PHhtbC8+",
    });
    expect(p).toMatchObject({
      form: "2550Q",
      periodType: "quarter",
      periodStart: "2026-01-01",
      periodEnd: "2026-03-31",
      status: "filed",
    });
  });
});

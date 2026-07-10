// Portal contract shapes as consumed by the SPA. These mirror the Accounting
// Firm Portal's @portal/shared payloads (VatSummaryResponse etc.). Kept as a
// local copy so the app has no cross-repo dependency; the server connector
// (server/src/portal.ts) speaks the same shapes.

export interface PortalClient {
  id: string;
  businessName: string;
  tin: string | null;
  address: string | null;
  taxType: string | null;
  fiscalYearStart: string | null;
  currency: string;
}

export interface PortalVatSummary {
  client: { id: string; tin: string; vatRegistered: true };
  period: { year: number; quarter: number; start: string; end: string };
  sales: {
    vatable: { net: number; outputVAT?: number };
    zeroRated: { net: number };
    exempt: { net: number };
    governmentSalesMemo?: { net: number; creditableVATWithheld5pct: number };
  };
  purchases: {
    domesticPurchases: { net: number; inputVAT: number };
    servicesNonResident: { net: number; inputVAT: number };
    importationGoods: { net: number; inputVAT: number };
    othersWithInputTax: { net: number; inputVAT: number };
    domesticNoInputTax: { net: number };
    vatExemptImportation: { net: number };
    capitalGoodsGT1M: {
      items: {
        acquiredOn: string;
        cost: number;
        inputVAT: number;
        usefulLifeMonths: number;
      }[];
    };
  };
  exemptInputTax: {
    directlyAttributable: number;
    commonNotDirectlyAttributable: number;
  };
  otherCredits: { creditableVATWithheld: number; advanceVATPayments: number };
}

/** The push-back payload the Portal accepts at POST /clients/{id}/bir-filings. */
export interface BirFilingPushback {
  form: string;
  periodType: "month" | "quarter" | "year";
  periodStart: string;
  periodEnd: string;
  status: "draft" | "ready" | "filed";
  figures: Record<string, number>;
  xmlFilename: string;
  xmlBase64: string;
  pdfUrl?: string;
}

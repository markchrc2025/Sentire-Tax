// Portal contract shapes as consumed by the SPA. These mirror the Accounting
// Firm Portal's @portal/shared payloads (VatSummaryResponse etc.). Kept as a
// local copy so the app has no cross-repo dependency; the server connector
// (server/src/portal.ts) speaks the same shapes.

/** One BIR "Tax Types" registration line on a Portal client. */
export interface PortalTaxTypeRow {
  type?: string;
  form?: string;
  frequency?: string;
  startDate?: string;
}

/**
 * A Portal client. The Portal is the system of record for clients; Sentire
 * refreshes its Taxpayer from this on import. Carries the full BIR filer profile
 * so the mapping produces a complete Taxpayer. `professionalFee` / `billingMethod`
 * are firm-internal and intentionally NOT consumed here.
 */
export interface PortalClient {
  id: string;
  businessName: string;
  tin: string | null;
  address: string | null;
  taxType: string | null;
  fiscalYearStart: string | null;
  currency: string;

  // BIR filer profile (all nullable — a client may be partially filled).
  kind?: string | null; // "individual" | "non-individual"
  regName?: string | null;
  lastName?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  tradeName?: string | null;
  branch?: string | null;
  rdo?: string | null;
  rdoName?: string | null;
  city?: string | null;
  zip?: string | null;
  birthdate?: string | null; // ISO date/datetime
  incorpDate?: string | null;
  email?: string | null;
  phone?: string | null;
  citizenship?: string | null;
  civilStatus?: string | null;
  taxpayerType?: string | null;
  classification?: string | null;
  taxTypesJson?: PortalTaxTypeRow[] | null;
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

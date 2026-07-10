// mapping.ts — pure transforms between the Accounting Firm Portal's payloads and
// Sentire's domain (Taxpayer + 2550Q FilingData). No I/O, fully unit-tested.
//
// Contract notes honoured (design §7.3–7.5):
//  * amounts are net of VAT; the Generator derives Item 31B (12% × net), so we
//    only pre-fill Item 31A — never 31B;
//  * capital goods > ₱1M are Schedule 1 / amortization (Generator-owned), so they
//    are NOT auto-filled into Items 44–49 here;
//  * `creditableVATWithheld` is a single Item 16 total (already includes the
//    government 5% memo).

import type { FilingData, Taxpayer } from "../../types";
import type { BirFilingPushback, PortalClient, PortalVatSummary } from "./types";

/** Set a FilingData string field only when the amount is non-zero (clean pre-fill). */
function put(data: FilingData, key: string, value: number): void {
  if (value && Number.isFinite(value)) data[key] = String(value);
}

/** Normalise a TIN to 9 digits (strip separators); undefined stays undefined. */
function normalizeTin(tin: string | null | undefined): string {
  return (tin ?? "").replace(/\D/g, "").slice(0, 9);
}

/**
 * Map a Portal `vat-summary` into 2550Q FilingData (field ids read by
 * compute2550Q). Output-tax adjustments, carry-overs, and penalties stay manual.
 */
export function vatSummaryToFilingData(s: PortalVatSummary): FilingData {
  const data: FilingData = {
    year: String(s.period.year),
    quarter: String(s.period.quarter),
  };

  // Output side (Items 31A/32A/33A). 31B is derived by the engine (12% × 31A).
  put(data, "i31a", s.sales.vatable.net);
  put(data, "i32a", s.sales.zeroRated.net);
  put(data, "i33a", s.sales.exempt.net);

  // Current-period input tax (Items 44–49).
  put(data, "i44a", s.purchases.domesticPurchases.net);
  put(data, "i44b", s.purchases.domesticPurchases.inputVAT);
  put(data, "i45a", s.purchases.servicesNonResident.net);
  put(data, "i45b", s.purchases.servicesNonResident.inputVAT);
  put(data, "i46a", s.purchases.importationGoods.net);
  put(data, "i46b", s.purchases.importationGoods.inputVAT);
  put(data, "i47a", s.purchases.othersWithInputTax.net);
  put(data, "i47b", s.purchases.othersWithInputTax.inputVAT);
  put(data, "i48a", s.purchases.domesticNoInputTax.net);
  put(data, "i49a", s.purchases.vatExemptImportation.net);

  // Schedule 2 — VAT-exempt input tax (direct + common pool for apportionment).
  put(data, "sch2_direct", s.exemptInputTax.directlyAttributable);
  put(data, "sch2_ratable", s.exemptInputTax.commonNotDirectlyAttributable);

  // Credits: Item 16 (creditable VAT withheld) and Item 17 (advance payments).
  put(data, "i16", s.otherCredits.creditableVATWithheld);
  put(data, "i17", s.otherCredits.advanceVATPayments);

  return data;
}

/**
 * Map a Portal `Client` into a Taxpayer draft (design §7.4). The percentage-tax
 * ATC & rate are NOT taken from the Portal — they live on the taxpayer profile.
 */
export function portalClientToTaxpayer(
  client: PortalClient,
): Partial<Taxpayer> & { regName: string; tin: string } {
  const isVat = (client.taxType ?? "").toUpperCase().includes("VAT");
  const suggestedForm = isVat ? "2550Q" : "2551Q";
  return {
    kind: "non-individual",
    regName: client.businessName,
    tradeName: client.businessName,
    tin: normalizeTin(client.tin),
    branch: "00000",
    address: client.address ?? "",
    ...(client.taxType
      ? {
          taxTypes: [
            {
              type: client.taxType,
              form: suggestedForm,
              frequency: "Quarterly",
              ...(client.fiscalYearStart
                ? { startDate: client.fiscalYearStart }
                : {}),
            },
          ],
        }
      : {}),
  };
}

/** Suggested BIR form for a Portal client's registration (VAT → 2550Q). */
export function suggestedForm(client: PortalClient): string {
  return (client.taxType ?? "").toUpperCase().includes("VAT") ? "2550Q" : "2551Q";
}

/** Assemble the idempotent push-back payload for a generated filing. */
export function buildFilingPushback(input: {
  form: string;
  year: number;
  quarter: number;
  status: "draft" | "ready" | "filed";
  figures: Record<string, number>;
  xmlFilename: string;
  xmlBase64: string;
  pdfUrl?: string;
}): BirFilingPushback {
  const pad = (n: number) => String(n).padStart(2, "0");
  const startMonth = (input.quarter - 1) * 3 + 1;
  const endMonth = startMonth + 2;
  const lastDay = new Date(Date.UTC(input.year, endMonth, 0)).getUTCDate();
  return {
    form: input.form,
    periodType: "quarter",
    periodStart: `${input.year}-${pad(startMonth)}-01`,
    periodEnd: `${input.year}-${pad(endMonth)}-${pad(lastDay)}`,
    status: input.status,
    figures: input.figures,
    xmlFilename: input.xmlFilename,
    xmlBase64: input.xmlBase64,
    ...(input.pdfUrl ? { pdfUrl: input.pdfUrl } : {}),
  };
}

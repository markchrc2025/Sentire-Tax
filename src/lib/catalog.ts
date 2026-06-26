// catalog.ts — the list of supported forms and category colors.
// Ported from bir-data.jsx (CATALOG) and bir-shell.jsx (FORM_COLOR).

import type { CatalogEntry, FormCategory, FormCode } from "../types";

export const CATALOG: readonly CatalogEntry[] = [
  { code: "1701", name: "Annual Income Tax Return", sub: "Individuals (mixed income / business)", cat: "Income Tax", ready: true },
  { code: "1701A", name: "Annual Income Tax Return", sub: "Individuals — purely business/profession", cat: "Income Tax", ready: true },
  { code: "1701Q", name: "Quarterly Income Tax Return", sub: "Individuals, estates & trusts", cat: "Income Tax", ready: true },
  { code: "1702RT", name: "Annual Income Tax Return", sub: "Corporations — regular rate", cat: "Income Tax", ready: true },
  { code: "1702Q", name: "Quarterly Income Tax Return", sub: "Corporations & non-individuals", cat: "Income Tax", ready: true },
  { code: "2550Q", name: "Quarterly VAT Return", sub: "Value-Added Tax", cat: "Business Tax", ready: true },
  { code: "2551Q", name: "Quarterly Percentage Tax Return", sub: "Percentage Tax", cat: "Business Tax", ready: true },
  { code: "2307", name: "Certificate of Creditable Tax Withheld", sub: "At source (expanded)", cat: "Withholding", ready: true },
  { code: "2316", name: "Certificate of Compensation Payment", sub: "Tax withheld on compensation", cat: "Withholding", ready: true },
];

export const FORM_COLOR: Record<FormCategory, string> = {
  "Income Tax": "#A0627D",
  "Business Tax": "#5E7FB1",
  Withholding: "#4F9373",
};

export const CATEGORIES: readonly FormCategory[] = [
  "Income Tax",
  "Business Tax",
  "Withholding",
];

export function catalogEntry(code: FormCode): CatalogEntry | undefined {
  return CATALOG.find((c) => c.code === code);
}

/** Type guard: is this string one of the nine supported form codes? */
export function isFormCode(v: string | undefined): v is FormCode {
  return !!v && CATALOG.some((c) => c.code === v);
}

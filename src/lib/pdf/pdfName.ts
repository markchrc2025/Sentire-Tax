// pdfName.ts — the PDF naming convention: Form_Period_Full Name, with the
// amendment number beside the form code ("1701v1_2023_COMIA, MERLITO
// CASTILLO"). Used as the PDF's document title (shown by the embedded
// viewer) and as the suggested filename for Print / Save as PDF.

import type { Filing, Taxpayer } from "../../types";
import { filingVersion, versionLabel } from "../period";
import { displayName } from "../taxpayer";

/** Base name (no extension) for a filing's PDF. */
export function pdfBaseName(filing: Filing, tp: Taxpayer | null | undefined): string {
  const form = filing.form + versionLabel(filingVersion(filing));
  const period = filing.period || (typeof filing.data?.year === "string" ? filing.data.year : "");
  const dn = displayName(tp ?? null);
  const name = dn === "—" ? "" : dn;
  const raw = [form, period, name].filter(Boolean).join("_");
  // Strip characters that are illegal in filenames; keep commas and spaces.
  return raw.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim();
}

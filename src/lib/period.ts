// period.ts — taxable-period helpers. Annual forms key on the year ("2024");
// quarterly forms key on year + quarter ("2024-Q1"). The period string is the
// filing's address segment in /{form}/{period}/{tin}.

import type { FormCode } from "../types";

/** The four forms filed per quarter. */
export const QUARTERLY_FORMS: readonly FormCode[] = ["1701Q", "1702Q", "2550Q", "2551Q"];

export function isQuarterlyForm(form: FormCode | string | undefined): boolean {
  return !!form && QUARTERLY_FORMS.includes(form as FormCode);
}

/** Build a period segment from a year and optional quarter ("Q1".."Q4"). */
export function buildPeriod(year: string, quarter?: string): string {
  const y = year.trim();
  return quarter ? `${y}-${quarter}` : y;
}

/** Parse a period segment into its year and (if quarterly) quarter. */
export function parsePeriod(period: string): { year: string; quarter?: string } {
  const m = /^(\d{4})-(Q[1-4])$/i.exec(period.trim());
  if (m) return { year: m[1], quarter: m[2].toUpperCase() };
  return { year: period.trim() };
}

// ---- Filing versions (amended returns) -----------------------------------
//
// A taxpayer may only file the same form + period once; filing it again is an
// amended return. Amended filings carry a version number in the URL's form
// segment — /1701/2023/{tin} is the original, /1701v1/2023/{tin} the first
// amended return, v2 the second, and so on. The number is persisted inside
// the filing's data doc (key "__version") so every repository keeps it.

/** Amendment number of a filing: 0 = original, 1 = first amended (v1), … */
export function filingVersion(f: { data?: { __version?: unknown } | null }): number {
  const v = Number(f.data?.__version);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
}

/** "" for the original filing; "v1", "v2", … for amended versions. */
export function versionLabel(version: number): string {
  return version > 0 ? "v" + version : "";
}

/** The URL's form segment for a form + amendment number ("1701", "1701v2"). */
export function formSegment(form: string, version: number): string {
  return form + versionLabel(version);
}

/** Split a form segment like "1701v2" back into { form, version }. No BIR
 *  form code ends in v+digits, so the split is unambiguous. */
export function splitFormSegment(seg: string | undefined): { form: string; version: number } {
  const m = /^(.+?)[vV](\d+)$/.exec(seg ?? "");
  if (m) return { form: m[1], version: parseInt(m[2], 10) };
  return { form: seg ?? "", version: 0 };
}

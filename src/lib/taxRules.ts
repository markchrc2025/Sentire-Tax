// taxRules.ts — BIR thresholds, rates, and eligibility constants used by the
// per-form validators (src/components/editor/validators.ts). Kept as named,
// sourced constants so the "rules" are auditable in one place and easy to update
// when BIR adjusts them. These are *policy* facts, distinct from the arithmetic
// in src/lib/compute/* (which derives line totals).
//
// Sources are cited inline (NIRC = National Internal Revenue Code as amended;
// TRAIN = RA 10963; CREATE = RA 11534; EOPT = RA 11976; plus the relevant
// Revenue Regulations / Memorandum Circulars / Orders).

import { parsePeriod } from "./period";

/** VAT registration threshold — gross sales/receipts (NIRC §109(CC)/§236(G), TRAIN). */
export const VAT_THRESHOLD = 3_000_000;

/** Standard VAT rate (NIRC §106/§108, TRAIN). */
export const VAT_RATE = 0.12;

/** Optional Standard Deduction rate (NIRC §34(L)). 40% of gross sales/receipts
 *  for individuals; 40% of gross income for corporations. */
export const OSD_RATE = 0.4;

/** First ₱250,000 of taxable income is tax-exempt under the graduated table and
 *  is the once-only reduction allowed on the 8% option (NIRC §24(A)(2)(b), TRAIN). */
export const GRADUATED_ZERO_BRACKET = 250_000;

/** 8% optional income-tax rate for qualified self-employed/professionals
 *  (NIRC §24(A)(2)(b), TRAIN). */
export const EIGHT_PCT_RATE = 0.08;

/** Income tax over this amount may be paid in two equal installments
 *  (NIRC §56(A)(2), TRAIN — threshold raised from ₱2,000 to ₱2,000 stays;
 *  2nd installment due on or before Oct 15). */
export const INSTALLMENT_MIN_TAX = 2_000;

/** Regular corporate income tax rate, % (NIRC §27(A), CREATE). */
export const CIT_REGULAR_RATE = 25;

/** Reduced CIT rate, %, for domestic corps with net taxable income ≤ ₱5M AND
 *  total assets ≤ ₱100M excluding land (NIRC §27(A), CREATE). */
export const CIT_SMALL_RATE = 20;
export const CIT_SMALL_INCOME_CAP = 5_000_000;
export const CIT_SMALL_ASSETS_CAP = 100_000_000;

/** Minimum Corporate Income Tax rate, % of gross income (NIRC §27(E), CREATE).
 *  CREATE temporarily cut it to 1% for 7/1/2020–6/30/2023, then back to 2%. */
export const MCIT_RATE = 2;

/** 13th-month pay and other benefits are tax-exempt up to this ceiling
 *  (NIRC §32(B)(7)(e), TRAIN). Excess is taxable compensation. */
export const THIRTEENTH_MONTH_CAP = 90_000;

/**
 * Section 116 percentage-tax rate (%) for a taxable period. Generally 3%, but
 * CREATE (RA 11534) reduced it to 1% for quarters from 1 Jul 2020 to 30 Jun
 * 2023, reverting to 3% on 1 Jul 2023. Returns the rate that applies to the
 * given period string ("2024-Q1" / "2024"). Quarters that straddle a boundary
 * resolve to the rate covering the majority of the quarter.
 */
export function section116Rate(period: string): number {
  const { year, quarter } = parsePeriod(period);
  const y = Number(year);
  if (!Number.isFinite(y)) return 3;
  // 1% window: 2020-Q3 .. 2023-Q2 inclusive.
  const q = quarter ? Number(quarter.replace(/\D/g, "")) : 0;
  if (y < 2020 || y > 2023) return 3;
  if (y === 2020) return q >= 3 ? 1 : 3; // Q3 starts 1 Jul 2020
  if (y === 2021 || y === 2022) return 1;
  if (y === 2023) return q <= 2 ? 1 : 3; // Q2 ends 30 Jun 2023
  return 3;
}

/** Official percentage-tax ATC → rate (%) map (RMO 22-2019, NIRC §§116–127).
 *  PT010 (Sec. 116) is time-bound — use section116Rate() for the period. */
export const PT_ATC_RATES: Record<string, number> = {
  PT010: 3, // Sec. 116 (1% for 7/1/2020–6/30/2023 — see section116Rate)
  PT040: 3, // domestic carriers & keepers of garages (Sec. 117)
  PT041: 3, // international carriers (Sec. 118)
  PT060: 2, // franchises — gas & water utilities (Sec. 119)
  PT070: 3, // franchises — radio/TV broadcasting ≤₱10M (Sec. 119)
  PT090: 10, // overseas dispatch/message (Sec. 120)
  PT120: 2, // life insurance premiums (Sec. 123)
  PT130: 4, // agents of foreign insurance companies (Sec. 124)
};

/** Common expanded-withholding (2307) ATC → rate (%) for the rates the app
 *  surfaces (RR 11-2018 / RR 2-98 as amended). Codes whose rate varies by
 *  payee status are omitted (only sanity bounds are checked for those). */
export const WHT_2307_ATC_RATES: Record<string, number> = {
  WI010: 5, // professional/talent fees, individual, ≤₱3M
  WI011: 10, // professional/talent fees, individual, >₱3M
  WI515: 5, // rentals (real/personal property)
  WI158: 1, // goods — top withholding agent
  WI159: 2, // services — top withholding agent
};

// validators.ts — per-form "safeguard" checklist shown in the editor rail.
//
// These are *filling* safeguards, distinct from the arithmetic in
// src/lib/compute/* (which derives line totals — those can never be internally
// inconsistent, so we don't re-check sums here). Each validator focuses on what
// a filer can actually get wrong: missing required fields, eligibility/threshold
// breaches, wrong rates, and out-of-bounds amounts. Rules and thresholds come
// from src/lib/taxRules.ts (sourced to NIRC/TRAIN/CREATE/RR/RMC).

import type { FilingData, FormCode, Row2307, Row2551Q, Taxpayer } from "../../types";
import type {
  Comp1701,
  Comp1701A,
  Comp1701Q,
  Comp1702Q,
  Comp1702RT,
  Comp2307,
  Comp2316,
  Comp2550Q,
  Comp2551Q,
} from "../../lib/compute";
import { num } from "../../lib/format";
import { normalizeTin } from "../../lib/taxpayer";
import { parsePeriod } from "../../lib/period";
import {
  CIT_REGULAR_RATE,
  CIT_SMALL_INCOME_CAP,
  CIT_SMALL_RATE,
  PT_ATC_RATES,
  THIRTEENTH_MONTH_CAP,
  VAT_THRESHOLD,
  WHT_2307_ATC_RATES,
  section116Rate,
} from "../../lib/taxRules";

export type ValidationLevel = "error" | "warn" | "info" | "ok";

export interface ValidationItem {
  level: ValidationLevel;
  msg: string;
}

/** Context the validators need beyond the raw form data. */
export interface ValidationContext {
  tp: Taxpayer | null;
  /** The filing's period segment, e.g. "2024" or "2024-Q1". */
  period: string;
}

// ---- small helpers -------------------------------------------------------
const blank = (v: unknown): boolean => v == null || String(v).trim() === "";
/** Coerce a FilingData value (string | row[] | undefined) to a plain string. */
const txt = (v: unknown): string => (typeof v === "string" ? v : "");
const err = (msg: string): ValidationItem => ({ level: "error", msg });
const warn = (msg: string): ValidationItem => ({ level: "warn", msg });
const info = (msg: string): ValidationItem => ({ level: "info", msg });

/** Does the period's quarter (if any) equal Q4? */
function isQuarter(period: string, q: number): boolean {
  const { quarter } = parsePeriod(period);
  return quarter === "Q" + q;
}

// =========================================================================
// 1701A — Annual ITR, individuals purely business/profession
// =========================================================================
export function validate1701A(d: FilingData, comp: Comp1701A, ctx: ValidationContext): ValidationItem[] {
  const out: ValidationItem[] = [];
  if (blank(d.year)) out.push(err("Enter the taxable year (Item 1)."));
  if (blank(ctx.tp?.tin)) out.push(err("Taxpayer has no TIN — set it in Taxpayers."));
  if (blank(d.taxRate)) out.push(err("Choose a tax rate (Item 19): graduated or 8%."));
  if (blank(d.atc)) out.push(err("Select an ATC (Item 7)."));

  // Item 14 is required once foreign tax credits are claimed (Item 13 = Yes).
  if (d.foreignCredit === "yes" && blank(d.foreignTaxNo))
    out.push(warn("Claiming foreign tax credits — enter the Foreign Tax Number (Item 14)."));
  // Married filers should pick a filing status (Item 18).
  if (d.civil === "married" && blank(d.filing))
    out.push(warn("Choose your filing status — joint or separate (Item 18)."));

  const eight = d.taxRate === "eight";
  const sales = num(eight ? d.i47A : d.i36A);
  if (!sales) out.push(warn("Enter sales/revenues in Part IV."));

  // 8% optional rate is unavailable once gross sales/receipts exceed the ₱3M
  // VAT threshold (NIRC §24(A)(2)(b)).
  if (eight && comp.A.i53 > VAT_THRESHOLD)
    out.push(err(`8% rate unavailable — taxable base exceeds ₱${VAT_THRESHOLD.toLocaleString()}.`));

  // The optional 2nd installment can't exceed 50% of the tax due (NIRC §56(A)(2)).
  if (num(d.i23A) > comp.A.i20 * 0.5 + 1)
    out.push(warn("2nd installment (Item 23) can't exceed 50% of the tax due."));

  // Overpayment must be designated (refund / TCC / carry-over).
  if (comp.A.i22 < 0 && blank(d.over))
    out.push(warn("There's an overpayment — choose refund, TCC, or carry-over (and note carry-over is irrevocable)."));

  out.push(info("Annual ITR deadline: on or before April 15 of the following year."));
  return out;
}

// =========================================================================
// 1701 — Annual ITR, individuals with mixed income
// =========================================================================
export function validate1701(d: FilingData, comp: Comp1701, _ctx: ValidationContext): ValidationItem[] {
  const out: ValidationItem[] = [];
  if (blank(d.year)) out.push(err("Enter the taxable year."));
  if (blank(_ctx.tp?.tin)) out.push(err("Taxpayer has no TIN — set it in Taxpayers."));

  const A = comp.A;
  if (!A.sales && !A.comp) out.push(warn("Enter compensation and/or business income."));

  if (d.rateA === "eight" && A.gross8 > VAT_THRESHOLD)
    out.push(err(`8% rate unavailable — gross sales/receipts exceed ₱${VAT_THRESHOLD.toLocaleString()}.`));

  if (A.installment > A.taxDue * 0.5 + 1)
    out.push(warn("2nd installment can't exceed 50% of the tax due."));

  out.push(info("Annual ITR deadline: on or before April 15 of the following year."));
  return out;
}

// =========================================================================
// 1701Q — Quarterly ITR, individuals/estates/trusts
// =========================================================================
export function validate1701Q(d: FilingData, comp: Comp1701Q, ctx: ValidationContext): ValidationItem[] {
  const out: ValidationItem[] = [];
  if (blank(d.year)) out.push(err("Enter the taxable year."));
  const { quarter } = parsePeriod(ctx.period);
  if (!quarter) out.push(err("Select the taxable quarter (Q1–Q3)."));
  if (blank(ctx.tp?.tin)) out.push(err("Taxpayer has no TIN — set it in Taxpayers."));

  if (isQuarter(ctx.period, 4))
    out.push(warn("1701Q covers the 1st–3rd quarters only — file the annual 1701/1701A for the year."));

  if (d.rateA === "eight" && comp.A.income8 > VAT_THRESHOLD)
    out.push(err(`8% rate unavailable — cumulative gross sales/receipts exceed ₱${VAT_THRESHOLD.toLocaleString()}.`));

  out.push(info("1701Q deadlines: Q1 May 15 · Q2 Aug 15 · Q3 Nov 15."));
  return out;
}

// =========================================================================
// 1702-RT — Annual ITR, corporations at the regular rate
// =========================================================================
export function validate1702RT(d: FilingData, comp: Comp1702RT, ctx: ValidationContext): ValidationItem[] {
  const out: ValidationItem[] = [];
  if (blank(d.year)) out.push(err("Enter the taxable year/period."));
  if (blank(ctx.tp?.tin)) out.push(err("Taxpayer has no TIN — set it in Taxpayers."));
  if (!comp.i27) out.push(warn("Enter sales/receipts/revenues in Part IV."));

  out.push(...corporateRateChecks(comp.rate, comp.i39));

  if (comp.mcitApplies)
    out.push(info("MCIT (2% of gross income) exceeds the normal tax, so MCIT is used as the tax due."));

  out.push(info("Annual corporate ITR deadline: the 15th day of the 4th month after the close of the taxable year."));
  return out;
}

// =========================================================================
// 1702Q — Quarterly ITR, corporations/non-individuals
// =========================================================================
export function validate1702Q(d: FilingData, comp: Comp1702Q, ctx: ValidationContext): ValidationItem[] {
  const out: ValidationItem[] = [];
  if (blank(d.year)) out.push(err("Enter the taxable year/period."));
  const { quarter } = parsePeriod(ctx.period);
  if (!quarter) out.push(err("Select the taxable quarter (Q1–Q3)."));
  if (blank(ctx.tp?.tin)) out.push(err("Taxpayer has no TIN — set it in Taxpayers."));

  out.push(...corporateRateChecks(comp.rate, comp.s2_9));

  if (comp.mcitApplies)
    out.push(info("MCIT (2% of gross income) exceeds the normal tax, so MCIT is used as the tax due."));

  out.push(info("Quarterly corporate ITR deadline: within 60 days after the close of each quarter."));
  return out;
}

/** Shared regular-corporate-rate checks (25% standard, 20% for small corps). */
function corporateRateChecks(rate: number, netTaxable: number): ValidationItem[] {
  const out: ValidationItem[] = [];
  if (rate !== CIT_REGULAR_RATE && rate !== CIT_SMALL_RATE)
    out.push(warn(`Regular corporate rate is usually ${CIT_SMALL_RATE}% or ${CIT_REGULAR_RATE}% — check Item 40.`));
  if (rate === CIT_SMALL_RATE && netTaxable > CIT_SMALL_INCOME_CAP)
    out.push(err(`20% rate requires net taxable income ≤ ₱${CIT_SMALL_INCOME_CAP.toLocaleString()}.`));
  if (rate === CIT_SMALL_RATE)
    out.push(info("20% rate also requires total assets ≤ ₱100M (excluding land) — confirm eligibility."));
  return out;
}

// =========================================================================
// 2550Q — Quarterly VAT return
// =========================================================================
export function validate2550Q(d: FilingData, comp: Comp2550Q, ctx: ValidationContext): ValidationItem[] {
  const out: ValidationItem[] = [];
  if (blank(d.year)) out.push(err("Enter the taxable year/period."));
  const { quarter } = parsePeriod(ctx.period);
  if (!quarter) out.push(err("Select the taxable quarter (Q1–Q4)."));
  if (blank(ctx.tp?.tin)) out.push(err("Taxpayer has no TIN — set it in Taxpayers."));

  if (!comp.i34a) out.push(warn("Enter sales for the quarter (vatable, zero-rated, or exempt)."));

  out.push(info(`VAT applies once gross sales exceed ₱${VAT_THRESHOLD.toLocaleString()} a year.`));
  out.push(info("VAT is filed quarterly only (monthly 2550M discontinued from Jan 1, 2023)."));
  out.push(info("2550Q deadline: within 25 days after the close of the taxable quarter."));
  return out;
}

// =========================================================================
// 2551Q — Quarterly percentage tax return
// =========================================================================
export function validate2551Q(d: FilingData, _comp: Comp2551Q, ctx: ValidationContext): ValidationItem[] {
  const out: ValidationItem[] = [];
  if (blank(d.year)) out.push(err("Enter the taxable year/period."));
  const { quarter } = parsePeriod(ctx.period);
  if (!quarter) out.push(err("Select the taxable quarter (Q1–Q4)."));
  if (blank(ctx.tp?.tin)) out.push(err("Taxpayer has no TIN — set it in Taxpayers."));

  const rows = (d.rows as Row2551Q[] | undefined) || [];
  const active = rows.filter((r) => num(r.taxable) > 0 || !blank(r.atc));
  if (active.length === 0) out.push(warn("Add at least one percentage-tax line (ATC + taxable amount)."));

  const pt116 = section116Rate(ctx.period);
  active.forEach((r, i) => {
    const n = i + 1;
    if (num(r.taxable) > 0 && blank(r.atc)) out.push(err(`Line ${n}: select an ATC for the taxable amount.`));
    if (blank(r.atc)) return;
    const code = String(r.atc).toUpperCase();
    const expected = code === "PT010" ? pt116 : PT_ATC_RATES[code];
    if (expected == null) {
      out.push(warn(`Line ${n}: "${code}" isn't a recognized percentage-tax ATC.`));
      return;
    }
    if (!blank(r.rate) && Math.abs(num(r.rate) - expected) > 0.001)
      out.push(err(`Line ${n}: ${code} rate should be ${expected}% (entered ${num(r.rate)}%).`));
  });

  // Section 116 is time-bound: 1% for 7/1/2020–6/30/2023, else 3% (CREATE).
  if (active.some((r) => String(r.atc).toUpperCase() === "PT010"))
    out.push(info(`Section 116 rate for this period is ${pt116}% (1% applied 7/1/2020–6/30/2023, otherwise 3%).`));

  out.push(info("2551Q deadline: within 25 days after the close of the taxable quarter."));
  return out;
}

// =========================================================================
// 2307 — Certificate of Creditable Tax Withheld at Source (EWT)
// =========================================================================
export function validate2307(d: FilingData, comp: Comp2307, ctx: ValidationContext): ValidationItem[] {
  const out: ValidationItem[] = [];
  const payeeTin = normalizeTin(ctx.tp?.tin);
  if (!payeeTin) out.push(err("Payee has no TIN — set it in Taxpayers."));
  if (blank(d.periodFrom) || blank(d.periodTo)) out.push(err("Enter the period covered (From/To)."));
  if (blank(d.payorName)) out.push(err("Enter the payor's (withholding agent's) name (Item 7)."));
  if (blank(d.payorTin)) out.push(warn("Enter the payor's TIN (Item 6)."));
  if (payeeTin && normalizeTin(txt(d.payorTin)) === payeeTin)
    out.push(err("Payee and payor TINs can't be the same."));

  const rows = (d.rows as Row2307[] | undefined) || [];
  rows.forEach((r, i) => {
    const n = i + 1;
    const income = comp.rows[i]?.total ?? num(r.m1) + num(r.m2) + num(r.m3);
    const tax = num(r.tax);
    if (income <= 0) return;
    const code = String(r.atc || "").toUpperCase();
    if (!code) out.push(err(`Line ${n}: select an ATC for the income payment.`));
    if (tax > income) out.push(err(`Line ${n}: tax withheld can't exceed the income payment.`));
    else if (tax === 0) out.push(warn(`Line ${n}: income has no tax withheld — confirm this is correct.`));
    const rate = WHT_2307_ATC_RATES[code];
    if (rate != null && income > 0) {
      const expected = (income * rate) / 100;
      if (Math.abs(tax - expected) > Math.max(1, expected * 0.02))
        out.push(warn(`Line ${n}: tax withheld doesn't match ${rate}% of the income payment — verify.`));
    }
  });

  out.push(info("Attach this 2307 to the payee's income tax / percentage / VAT return as creditable tax."));
  return out;
}

// =========================================================================
// 2316 — Certificate of Compensation Payment / Tax Withheld
// =========================================================================
export function validate2316(d: FilingData, comp: Comp2316, ctx: ValidationContext): ValidationItem[] {
  const out: ValidationItem[] = [];
  const empyeeTin = normalizeTin(ctx.tp?.tin);
  if (!empyeeTin) out.push(err("Employee has no TIN — set it in Taxpayers."));
  if (blank(d.year) || !/^\d{4}$/.test(String(d.year).trim())) out.push(err("Enter the 4-digit calendar year (Item 1)."));
  if (blank(d.empName)) out.push(err("Enter the employer's name (Item 13)."));
  if (blank(d.empTin)) out.push(warn("Enter the employer's TIN (Item 12)."));
  if (empyeeTin && normalizeTin(txt(d.empTin)) === empyeeTin)
    out.push(err("Employee and employer TINs can't be the same."));

  // 13th-month pay & other benefits are non-taxable only up to ₱90,000.
  if (num(d.i34) > THIRTEENTH_MONTH_CAP)
    out.push(err(`Non-taxable 13th-month & other benefits can't exceed ₱${THIRTEENTH_MONTH_CAP.toLocaleString()} — the excess is taxable.`));

  if (comp.i24 !== comp.i28)
    out.push(info("Tax due ≠ tax withheld — substituted filing requires them to be equal; otherwise the employee files an ITR."));

  out.push(info("Give BIR Form 2316 to the employee on or before January 31 of the following year."));
  return out;
}

// =========================================================================
// Dispatcher
// =========================================================================
export function validateFor(
  form: FormCode,
  data: FilingData,
  comp: unknown,
  ctx: ValidationContext,
): ValidationItem[] {
  switch (form) {
    case "1701A":
      return validate1701A(data, comp as Comp1701A, ctx);
    case "1701":
      return validate1701(data, comp as Comp1701, ctx);
    case "1701Q":
      return validate1701Q(data, comp as Comp1701Q, ctx);
    case "1702RT":
      return validate1702RT(data, comp as Comp1702RT, ctx);
    case "1702Q":
      return validate1702Q(data, comp as Comp1702Q, ctx);
    case "2550Q":
      return validate2550Q(data, comp as Comp2550Q, ctx);
    case "2551Q":
      return validate2551Q(data, comp as Comp2551Q, ctx);
    case "2307":
      return validate2307(data, comp as Comp2307, ctx);
    case "2316":
      return validate2316(data, comp as Comp2316, ctx);
    default:
      return [];
  }
}

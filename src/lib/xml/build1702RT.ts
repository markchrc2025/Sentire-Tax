// build1702RT.ts — authentic eBIRForms XML export for BIR Form 1702-RT.
// Field keys, namespace (frm1702RT), CRLF/tab assembly and tail match a real
// eBIRForms 1702-RT offline-package export (a 4-page form — the largest). Pure.
//
// 1702-RT specifics versus the simpler forms:
//   * TIN is FOUR parts (TIN1/2/3/4); TIN4 is the 3-digit branch code.
//   * Pages 2/3/4 repeat the TIN + a RAW (un-encoded) registered name.
//   * Email stays namespaced (frm1702RT:txtPg1Pt1I12Email), not a global txtEmail.
//   * Most numeric fields are emitted as bare "0" (NOT "0.00"); only the
//     amount fields we actually compute use amt() peso formatting.
//   * Item 40 rate is a string with a "%" suffix (e.g. "25%").

import type { Filing, Taxpayer } from "../../types";
import type { Comp1702RT } from "../compute";
import { amt, enc, parseYear, rb, tinParts, type XmlRow } from "./xmlkit";

const NS = "frm1702RT:";

/**
 * 1702-RT amount formatting: the authentic sample emits a bare "0" for empty
 * numeric fields (never "0.00") but comma/decimal peso formatting for non-zero
 * values. `num1702()` reproduces that — "0" when zero, amt() otherwise.
 */
function num1702(n: number): string {
  return n === 0 ? "0" : amt(n);
}

/** Registered name for a company (or "LAST, FIRST" fallback for individuals). */
function regName(tp: Taxpayer | null): string {
  if (!tp) return "";
  if (tp.kind === "individual") return [tp.lastName, tp.firstName].filter(Boolean).join(", ");
  return tp.regName || "";
}

/** ISO yyyy-mm-dd → MM/DD/YYYY (date of incorporation / item 10). */
function incDate(iso?: string): string {
  if (!iso) return "";
  const [y, m, d] = String(iso).split("-");
  if (!y || !m || !d) return iso;
  return m + "/" + d + "/" + y;
}

/** Build the authentic 1702-RT eBIRForms XML string. */
export function build1702RT(filing: Filing, tp: Taxpayer | null, comp: Comp1702RT): string {
  const d = filing.data || {};
  const t = tinParts(tp);
  const yr = parseYear(d.year);
  const yy = yr.yyyy.slice(-2); // 2-digit year ("25")
  const rdo = (tp && tp.rdo) || "";
  const calendar = d.periodType !== "fiscal"; // default calendar
  const itemized = (d.method as string) !== "osd"; // default itemized
  const name = regName(tp);

  const rows: XmlRow[] = [];
  /** namespaced field, value emitted verbatim (pre-formatted). */
  const P = (key: string, val: string) => rows.push([NS + key, val]);
  /** global field (no namespace), verbatim. */
  const G = (key: string, val: string) => rows.push([key, val]);
  /** bare integer "0" for the schedule fields the app does not capture. */
  const Z = (key: string) => P(key, "0");
  /** empty namespaced field. */
  const E = (key: string) => P(key, "");

  // ---------------------------------------------------------------- PAGE 1
  // Background
  P("rdoPg1I1Calendar", rb(calendar));
  P("rdoPg1I1Fiscal", rb(!calendar));
  P("ddlPg1I2Month", yr.mm);
  P("txtPg1I2Year", yy);
  P("rdoPg1I3AmmendYes", rb(d.amended === "yes"));
  P("rdoPg1I3AmmendNo", rb(d.amended !== "yes"));
  P("rdoPg1I4ShortPeriodYes", rb(d.shortPeriod === "yes"));
  P("rdoPg1I4ShortPeriodNo", rb(d.shortPeriod !== "yes"));
  P("rdoPg1I5Atc", rb(false));
  P("drpPg1I5AtcOther", (d.atc as string) || "IC010");
  P("rdoPg1I5AtcOther", rb(false));

  // TIN (4 parts; TIN4 = branch)
  P("txtPg1Pt1I6TIN1", t.t1);
  P("txtPg1Pt1I6TIN2", t.t2);
  P("txtPg1Pt1I6TIN3", t.t3);
  P("txtPg1Pt1I6TIN4", t.branch3);
  G("BranchMaskP1", "00000");
  P("txtRDO", rdo);
  P("drpPg1Pt1I7RDOCode", rdo);

  // Name (registered name on page 1 is URL-encoded) + address
  P("txtPg1Pt1I8Name1", enc(name));
  E("txtPg1Pt1I8Name2");
  E("txtPg1Pt1I8Name3");
  P("txtPg1Pt1I9Address1", enc(tp ? [tp.address, tp.city].filter(Boolean).join(" ") : ""));
  E("txtPg1Pt1I9Address2");
  E("txtPg1Pt1I9Address3");
  P("txtZIP", (tp && tp.zip) || "");
  P("txtPg1Pt1I10", incDate(tp ? tp.incorpDate : ""));
  P("txtPg1Pt1I11Contact", (tp && tp.phone) || "");
  P("txtPg1Pt1I12Email", (tp && tp.email) || ""); // namespaced on 1702RT

  // Method of deductions
  P("rdoPg1Pt1I13ItemizedDeduction", rb(itemized));
  P("rdoPg1Pt1I13OptionalStandard", rb(!itemized));

  // Part II — Total Tax Payable (items 14-21)
  P("txtPg1Pt2I14IncomeTax", num1702(comp.i14));
  P("txtPg1Pt2I15TotalTaxCredits", num1702(comp.i15));
  P("txtPg1Pt2I16NetTax", num1702(comp.i16));
  P("txtPg1Pt2I17Surcharge", num1702(comp.i17));
  P("txtPg1Pt2I18Interest", num1702(comp.i18));
  P("txtPg1Pt2I19Compromise", num1702(comp.i19));
  P("txtPg1Pt2I20TotalPenalties", num1702(comp.i20));
  P("txtPg1Pt2I21TotalAmount", num1702(comp.i21));
  P("rdoPg1Pt2I21OverpaymentRefunded", rb(d.over === "refund"));
  P("rdoPg1Pt2I21OverpaymentIssued", rb(d.over === "tcc"));
  P("rdoPg1Pt2I21OverpaymentCarried", rb(d.over === "carry"));

  // Signatories (not captured by the app)
  E("txtSignaturePresident");
  E("txtSignatureTreasurer");
  P("txtPg1Pt2PagesFilled", "000");
  E("txtPg1Pt2Signatory1");
  E("txtPg1Pt2SignatoryTin1");
  E("txtPg1Pt2Signatory2");
  E("txtPg1Pt2SignatoryTin2");

  // Part III — Details of Payment (items 23-26; user-entry, not captured)
  E("txtPg1Pt3I23DebitMemoC1");
  E("txtPg1Pt3I23DebitMemoC2");
  E("txtPg1Pt3I23DebitMemoC3Date");
  Z("txtPg1Pt3I23DebitMemoC4Amount");
  E("txtPg1Pt3I24CheckC1");
  E("txtPg1Pt3I24CheckC2");
  E("txtPg1Pt3I24CheckC3Date");
  Z("txtPg1Pt3I24CheckC4Amount");
  E("txtPg1Pt3I25TaxDebitC2");
  E("txtPg1Pt3I25TaxDebitDate");
  Z("txtPg1Pt3I25TaxDebitC4Amount");
  E("txtPg1Pt3I26Others");
  E("txtPg1Pt3I26OthersC1");
  E("txtPg1Pt3I26OthersC2");
  E("txtPg1Pt3I26OthersC3Date");
  Z("txtPg1Pt3I26OthersC4Amount");

  // ---------------------------------------------------------------- PAGE 2
  P("txtPg2TIN1", t.t1);
  P("txtPg2TIN2", t.t2);
  P("txtPg2TIN3", t.t3);
  P("txtPg2TIN4", t.branch3);
  G("txtBranchMaskP2", "00000");
  P("txtPg2RegisteredName", name); // RAW (not encoded) on pages 2-4

  // Part IV — Computation of Tax (items 27-56)
  P("txtPg2Pt4I27Sales", num1702(comp.i27));
  P("txtPg2Pt4I28LessSales", num1702(comp.i28));
  P("txtPg2Pt4I29NetSales", num1702(comp.i29));
  P("txtPg2Pt4I30LessCost", num1702(comp.i30));
  P("txtPg2Pt4I31GrossIncome", num1702(comp.i31));
  P("txtPg2Pt4I32AddOtherTaxable", num1702(comp.i32));
  P("txtPg2Pt4I33TotalGross", num1702(comp.i33));
  P("txtPg2Pt4I34OrdinaryAllowable", num1702(comp.i34));
  P("txtPg2Pt4I35SpecialAllowable", num1702(comp.i35));
  P("txtPg2Pt4I36Nolco", num1702(comp.i36));
  P("txtPg2Pt4I37TotalItemized", num1702(comp.i37));
  P("txtPg2Pt4I38OptionalStandard", num1702(comp.i38));
  P("txtPg2Pt4I39NetTaxable", num1702(comp.i39));
  P("Pg2Pt4I40IncomeTaxRate", `${comp.rate}%`);
  P("txtPg2Pt4I41IncomeTaxDue", num1702(comp.i41));
  P("txtPg2Pt4I42MinimumCorporate", num1702(comp.i42));
  P("txtPg2Pt4I43TotalIncomeTax", num1702(comp.i43));
  P("txtPg2Pt4I44ExcessCredits", num1702(comp.i44));
  P("txtPg2Pt4I45IncomeTaxPaymentUnderMCIT", num1702(comp.i45));
  P("txtPg2Pt4I46IncomeTaxUnderRegular", num1702(comp.i46));
  P("txtPg2Pt4I47ExcessMCIT", num1702(comp.i47));
  P("txtPg2Pt4I48CreditableTaxWithheldFromPrevious", num1702(comp.i48));
  P("txtPg2Pt4I49CreditableTaxWithheldFor4thQuarter", num1702(comp.i49));
  P("txtPg2Pt4I50ForeignTaxCredits", num1702(comp.i50));
  P("txtPg2Pt4I51TaxPaidInReturn", num1702(comp.i51));
  P("txtPg2Pt452SpecialTaxCredits", num1702(comp.i52));
  E("txtPg2Pt4I53C1");
  P("txtPg2Pt4I53C2", num1702(comp.i53));
  E("txtPg2Pt4I54C1");
  P("txtPg2Pt4I54C2", num1702(comp.i54));
  P("txtPg2Pt4I55TotalTaxCredits", num1702(comp.i55));
  P("txtPg2Pt4I56NetTax", num1702(comp.i56));
  // Part V — supplemental (not captured)
  Z("txtPg2Pt5I57SpecialAllowable");
  Z("txtPg2Pt5I58AddSpecialTax");
  Z("txtPg2Pt5I59TotalTax");

  // ---------------------------------------------------------------- PAGE 3
  // Schedule 1 (itemized deduction detail) + Schedule 2 (special allowable).
  // The app does not capture this line-item detail → emit "0"/empty.
  P("txtPg3TIN1", t.t1);
  P("txtPg3TIN2", t.t2);
  P("txtPg3TIN3", t.t3);
  P("txtPg3TIN4", t.branch3);
  G("txtBranchMaskP3", "00000");
  P("txtPg3RegisteredName", name);

  Z("txtPg3Sc1I1Amortization");
  Z("txtPg3Sc1I2BadDebts");
  Z("txtPg3Sc1I3CharitableContributions");
  Z("txtPg3Sc1I4Depletion");
  Z("txtPg3Sc1I5Depreciation");
  Z("txtPg3Sc1I6Entertainment");
  Z("txtPg3Sc1I7FringeBenefits");
  Z("txtPg3Sc1I8Interest");
  Z("txtPg3Sc1I9Losses");
  Z("txtPg3Sc1I10PensionTrust");
  Z("txtPg3Sc1I11Rental");
  Z("txtPg3Sc1I12Research");
  Z("txtPg3Sc1I13Salaries");
  Z("txtPg3Sc1I14Contributions");
  Z("txtPg3Sc1I15TaxesandLicenses");
  Z("txtPg3Sc1I16TransportationandTravel");
  Z("txtPg3Sc1I17aJanitorial");
  Z("txtPg3Sc1I17bProfessionalFees");
  Z("txtPg3Sc1I17cSecurityServices");
  for (const r of ["d", "e", "f", "g", "h", "i"]) {
    E(`txtPg3Sc1I17${r}C1`);
    Z(`txtPg3Sc1I17${r}C2`);
  }
  Z("txtPg3Sc1I18TotalOrdinaryAllowable");
  for (let i = 1; i <= 4; i++) {
    E(`txtPg3Sc2I${i}C1`);
    E(`txtPg3Sc2I${i}C2`);
    Z(`txtPg3Sc2I${i}C3`);
  }
  Z("txtPg3Sc2I5TotalSpecialAllowable");

  // ---------------------------------------------------------------- PAGE 4
  // Schedules 3 (NOLCO), 4 (Excess MCIT) and 5 (reconciliation) — detail
  // the app does not capture → "0"/empty.
  P("txtPg4TIN1", t.t1);
  P("txtPg4TIN2", t.t2);
  P("txtPg4TIN3", t.t3);
  P("txtPg4TIN4", t.branch3);
  G("txtBranchMaskP4", "00000");
  P("txtPg4RegisteredName", name);

  // Schedule 3 — NOLCO computation
  Z("txtPg4Sc3I1GrossIncome");
  Z("txtPg4Sc3I2TotalDeductions");
  Z("txtPg4Sc3I3NetOperatingLoss");
  for (let i = 4; i <= 7; i++) {
    E(`txtPg4Sc3AI${i}C1`);
    Z(`txtPg4Sc3AI${i}C2`);
    Z(`txtPg4Sc3AI${i}C3`);
  }
  for (let i = 4; i <= 7; i++) {
    Z(`txtPg4Sc3AI${i}C4`);
    Z(`txtPg4Sc3AI${i}C5`);
    Z(`txtPg4Sc3AI${i}C6`);
  }
  Z("txtPg4Sc4I8TotalNOLCO");

  // Schedule 4 — Excess MCIT (rows 1-3, cols C1..C8)
  for (let i = 1; i <= 3; i++) {
    E(`txtPg4Sc4I${i}C1`);
    Z(`txtPg4Sc4I${i}C2`);
    Z(`txtPg4Sc4I${i}C3`);
    Z(`txtPg4Sc4I${i}C4`);
  }
  for (let i = 1; i <= 3; i++) {
    Z(`txtPg4Sc4I${i}C5`);
    Z(`txtPg4Sc4I${i}C6`);
    Z(`txtPg4Sc4I${i}C7`);
    Z(`txtPg4Sc4I${i}C8`);
  }
  Z("txtPg4Sc4I4TotalExcessMCIT");

  // Schedule 5 — reconciliation of net income per books vs taxable
  Z("txtPg4Sc5I1NetIncome");
  for (let i = 2; i <= 3; i++) {
    E(`txtPg4Sc5I${i}C1`);
    Z(`txtPg4Sc5I${i}C2`);
  }
  Z("txtPg4Sc5I4Total");
  for (let i = 5; i <= 8; i++) {
    E(`txtPg4Sc5I${i}C1`);
    Z(`txtPg4Sc5I${i}C2`);
  }
  Z("txtPg4Sc5I9Total");
  Z("txtPg4Sc5I10NetTaxableIncome");

  // ---- counter / subtotal helper fields (UI controls; always "0") ----
  Z("txtPg2Pt4I54CtrModal");
  Z("txtPg3Sc1I17iCtrModal");
  Z("txtPg3Sc2I4CtrModal");
  Z("txtPg4Sc5I3CtrModal");
  Z("txtPg4Sc5I6CtrModal");
  Z("txtPg4Sc5I8CtrModal");
  P("txtCurrentPage", "1");
  P("txtMaxPage", "4");
  Z("txtPg4Sc3I3Subtotal");
  Z("txtPg4Sc4I4Subtotal");
  Z("txtPg3Sc1I17iSubtotal");
  Z("txtPg3Sc2I4Subtotal");
  Z("txtPg4Sc3AI7C2Subtotal");
  Z("txtPg4Sc3AI7C3Subtotal");
  Z("txtPg4Sc3AI7C4Subtotal");
  Z("txtPg4Sc3AI7C5Subtotal");
  Z("txtPg4Sc3AI7C6Subtotal");
  Z("txtPg2Pt4I54Subtotal");
  Z("txtPg4Sc5I3Subtotal");
  Z("txtPg4Sc5I6Subtotal");
  Z("txtPg4Sc5I8Subtotal");

  // ---- global tail fields ----
  G("driveSelectTPExport", "0");
  G("txtFinalFlag", filing.status === "filed" ? "1" : "0");
  G("txtEnroll", "Y");
  G("ebirOnlineConfirmUsername", "");
  G("ebirOnlineUsername", "");
  G("ebirOnlineSecret", "");

  // ---- assemble (CRLF + trailing TAB per div, 12-space lead, BIR 2014.0 tail) ----
  const lead = "            ";
  const trail = "\t\r";
  const sep = "\n";
  const head = "<?xml version='1.0'?>\t\r\n";
  const body = rows.map(([k, v]) => `${lead}<div>${k}=${v}${k}=</div>${trail}`).join(sep);
  const tail = `${lead}\t\r\n${lead}All Rights Reserved BIR 2014.0`;
  return `${head}${body}${sep}${tail}`;
}

/** eBIRForms filename: <tin><branch>1702RTv2018<mm><yyyy>.xml (annual, mm=12). */
export function fileName1702RT(filing: Filing, tp: Taxpayer | null): string {
  const t = tinParts(tp);
  const yr = parseYear((filing.data || {}).year);
  return `${t.t1}${t.t2}${t.t3}${t.branch3}1702RTv2018${yr.mm}${yr.yyyy}.xml`;
}

// Re-export the shared download helper so existing imports keep working.
export { download } from "./xmlkit";

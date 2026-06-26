// build1701A.ts — eBIRForms-format XML export for the 1701A.
// Ported from bir-xml.jsx. Mirrors the official offline package:
//   <?xml version='1.0'?> … <div>KEY=VALUEKEY=</div> … All Rights Reserved BIR 2012.
// build1701A() is pure; download() is the only browser-dependent helper.

import type { Filing, Taxpayer } from "../../types";
import type { Comp1701A } from "../compute";
import { num } from "../format";

// URL-encode like eBIRForms (comma->%2C, space->%20). encodeURIComponent matches.
export function enc(v: unknown): string {
  if (v == null) return "";
  return encodeURIComponent(String(v));
}

// amount -> "1,234,567.00"
export function amt(n: unknown): string {
  const v = num(n);
  return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const rb = (cond: boolean): string => (cond ? "true" : "false");

// ISO yyyy-mm-dd -> MM/DD/YYYY
function dob(iso?: string): string {
  if (!iso) return "";
  const p = String(iso).split("-");
  if (p.length === 3) return p[1] + "/" + p[2] + "/" + p[0];
  return iso;
}

export function tinParts(tp: Taxpayer | null) {
  const d = String((tp && tp.tin) || "").replace(/\D/g, "");
  return {
    t1: d.slice(0, 3),
    t2: d.slice(3, 6),
    t3: d.slice(6, 9),
    branch: String((tp && tp.branch) || "000")
      .replace(/\D/g, "")
      .padStart(3, "0")
      .slice(0, 5),
  };
}

export function parseYear(y: unknown): { mm: string; yyyy: string } {
  const s = String(y || "");
  if (s.includes("/")) {
    const [m, yr] = s.split("/");
    return { mm: (m || "12").padStart(2, "0"), yyyy: yr || "" };
  }
  return { mm: "12", yyyy: s.slice(0, 4) };
}

/** Build the 1701A eBIRForms XML string. ns = "frm1701A". */
export function build1701A(filing: Filing, tp: Taxpayer | null, comp: Comp1701A): string {
  const d = filing.data || {};
  const ns = "frm1701A";
  const t = tinParts(tp);
  const yr = parseYear(d.year);
  const name = tp
    ? tp.kind === "individual"
      ? [tp.lastName, tp.firstName, tp.middleName].filter(Boolean).join(", ")
      : tp.regName || ""
    : "";
  const lastName = tp ? (tp.kind === "individual" ? tp.lastName : tp.regName) : "";
  const rate = (d.taxRate as string) || "graduated";
  const rows: Array<[string, string]> = [];
  const put = (key: string, val: unknown, raw?: boolean) =>
    rows.push([ns + ":" + key, raw ? (val == null ? "" : String(val)) : enc(val)]);
  const putRaw = (key: string, val: unknown) =>
    rows.push([key, val == null ? "" : String(val)]); // global (no ns) fields, raw

  // ---- Part I: Background ----
  put("txtPg1I1Year", yr.yyyy);
  put("rdoPg1I2AmendedYes", rb(d.amended === "yes"), true);
  put("rdoPg1I2AmendedNo", rb(d.amended !== "yes"), true);
  put("rdoPg1I3ShortPeriodYes", rb(d.shortPeriod === "yes"), true);
  put("rdoPg1I3ShortPeriodNo", rb(d.shortPeriod !== "yes"), true);
  put("txtPg1I4TIN1", t.t1);
  put("txtPg1I4TIN2", t.t2);
  put("txtPg1I4TIN3", t.t3);
  put("txtPg1I4BranchCode", t.branch);
  put("txtPg1I5RDOCode", (tp && tp.rdo) || "");
  put("rdoPg1I6TaxpayerTypeS", rb(d.taxpayerType === "single"), true);
  put("rdoPg1I6TaxpayerTypeP", rb(d.taxpayerType === "prof"), true);
  put("rdoPg1I7ATC_II012", rb(d.atc === "II012"), true);
  put("rdoPg1I7ATC_II014", rb(d.atc === "II014"), true);
  put("rdoPg1I7ATC_II015", rb(d.atc === "II015"), true);
  put("rdoPg1I7ATC_II017", rb(d.atc === "II017"), true);
  put("txtPg1I8TaxpayerName", name);
  put("txtPg1I9Address", tp ? [tp.address, tp.city].filter(Boolean).join(" ") : "");
  put("txtPg1I9AZipCode", (tp && tp.zip) || "");
  put("txtPg1I10BirthDate", dob(tp ? tp.birthdate : ""));
  putRaw("txtEmail", (tp && tp.email) || ""); // email kept raw, global key (matches sample)
  put("txtPg1I12Citizenship", (tp && tp.citizenship) || "");
  put("rdoPg1I13ForeignTaxCreditsYes", rb(d.foreignCredit === "yes"), true);
  put("rdoPg1I13ForeignTaxCreditsNo", rb(d.foreignCredit !== "yes"), true);
  put("txtPg1I14ForeignTaxNumber", d.foreignTaxNo || "");
  put("txtPg1I15TelNum", (tp && tp.phone) || "");
  put("rdoPg1I16CivilStatusS", rb(d.civil === "single"), true);
  put("rdoPg1I16CivilStatusM", rb(d.civil === "married"), true);
  put("rdoPg1I16CivilStatusLS", rb(d.civil === "sep"), true);
  put("rdoPg1I16CivilStatusW", rb(d.civil === "widow"), true);
  put("rdoPg1I17SpouseIncomeYes", rb(d.spouseIncome === "yes"), true);
  put("rdoPg1I17SpouseIncomeNo", rb(d.spouseIncome === "no"), true);
  put("rdoPg1I18FilingStatusJ", rb(d.filing === "joint"), true);
  put("rdoPg1I18FilingStatusS", rb(d.filing === "separate"), true);
  put("rdoPg1I19TaxRateG", rb(rate === "graduated"), true);
  put("rdoPg1I19AMethodDeductionO", rb(rate === "graduated"), true);
  put("rdoPg1I19TaxRate8", rb(rate === "eight"), true);

  // ---- Part II: Total Tax Payable (items 20-31) ----
  const A = comp.A;
  const B = comp.B;
  put("txtPg1I20ATaxDue", amt(A.i20), true);
  put("txtPg1I20BTaxDue", amt(B.i20), true);
  put("txtPg1I21ATaxCredits", amt(A.i21), true);
  put("txtPg1I21BTaxCredits", amt(B.i21), true);
  put("txtPg1I22ANetTaxPayable", amt(A.i22), true);
  put("txtPg1I22BNetTaxPayable", amt(B.i22), true);
  put("txtPg1I23A", amt(A.i23), true);
  put("txtPg1I23B", amt(B.i23), true);
  put("txtPg1I24ATaxPayable", amt(A.i24), true);
  put("txtPg1I24BTaxPayable", amt(B.i24), true);
  put("txtPg1I25ASurcharge", amt(A.i25), true);
  put("txtPg1I25BSurcharge", amt(B.i25), true);
  put("txtPg1I26AInterest", amt(A.i26), true);
  put("txtPg1I26BInterest", amt(B.i26), true);
  put("txtPg1I27ACompromise", amt(A.i27), true);
  put("txtPg1I27BCompromise", amt(B.i27), true);
  put("txtPg1I28ATotalPenalties", amt(A.i28), true);
  put("txtPg1I28BTotalPenalties", amt(B.i28), true);
  put("txtPg1I29ATotalAmtPyble", amt(A.i29), true);
  put("txtPg1I29BTotalAmtPyble", amt(B.i29), true);
  put("txtPg1I30AggregateAmtPyble", amt(comp.i30), true);
  put("rdoPg1OverpaymentRefund", rb(d.over === "refund"), true);
  put("rdoPg1OverpaymentTCC", rb(d.over === "tcc"), true);
  put("rdoPg1OverpaymentCarryOver", rb(d.over === "carry"), true);
  put("txtPg1I31NumberOfAttachments", String(d.attachments || "00").padStart(2, "0"));

  // ---- Part III: Details of Payment (items 32-35) ----
  const pay: Array<[string, string]> = [
    ["32", "p32"],
    ["33", "p33"],
    ["34", "p34"],
    ["35", "p35"],
  ];
  pay.forEach(([no, k]) => {
    put("txtPg1I" + no + "Agency", d[k + "bank"] || "");
    put("txtPg1I" + no + "Number", d[k + "num"] || "");
    put("txtPg1I" + no + "Date", d[k + "date"] || "");
    put("txtPg1I" + no + "Amount", d[k + "amt"] ? amt(d[k + "amt"]) : "", true);
  });

  // ---- Page 2 header ----
  put("txtPg2TIN1", t.t1);
  put("txtPg2TIN2", t.t2);
  put("txtPg2TIN3", t.t3);
  put("txtPg2BranchCode", t.branch);
  put("txtPg2TaxpayerName", lastName);

  // ---- Part IV.A: Graduated/OSD (items 36-46) ----
  const g: Array<[string, keyof typeof A]> = [
    ["36", "i36"], ["37", "i37"], ["38", "i38"], ["39", "i39"], ["40", "i40"],
    ["41", "i41"], ["42", "i42"], ["43", "i43"], ["44", "i44"], ["45", "i45"], ["46", "i46"],
  ];
  g.forEach(([no, k]) => {
    put("txtPg2I" + no + "A", amt(A[k]), true);
    put("txtPg2I" + no + "B", amt(B[k]), true);
  });
  put("txtPg2I41Desc", d.i41label || "");
  put("txtPg2I42Desc", d.i42label || "");

  // ---- Part IV.B: 8% (items 47-56) ----
  const e: Array<[string, keyof typeof A]> = [
    ["47", "i47"], ["48", "i48"], ["49", "i49"], ["50", "i50"], ["51", "i51"],
    ["52", "i52"], ["53", "i53"], ["54", "i54"], ["55", "i55"], ["56", "i56"],
  ];
  e.forEach(([no, k]) => {
    put("txtPg2I" + no + "A", amt(A[k]), true);
    put("txtPg2I" + no + "B", amt(B[k]), true);
  });
  put("txtPg2I50Desc", d.i50label || "");
  put("txtPg2I51Desc", d.i51label || "");

  // ---- Part IV.C: Credits (items 57-65) ----
  const c: Array<[string, keyof typeof A]> = [
    ["57", "i57"], ["58", "i58"], ["59", "i59"], ["60", "i60"], ["61", "i61"],
    ["62", "i62"], ["63", "i63"], ["64", "i64"], ["65", "i65"],
  ];
  c.forEach(([no, k]) => {
    put("txtPg2I" + no + "A", amt(A[k]), true);
    put("txtPg2I" + no + "B", amt(B[k]), true);
  });

  // ---- Part V: Spouse background (items 66-70) ----
  put("txtPg2I66SpouseTIN1", String(d.spouseTin || "").replace(/\D/g, "").slice(0, 3));
  put("txtPg2I66SpouseTIN2", String(d.spouseTin || "").replace(/\D/g, "").slice(3, 6));
  put("txtPg2I66SpouseTIN3", String(d.spouseTin || "").replace(/\D/g, "").slice(6, 9));
  put("txtPg2I67SpouseRDOCode", d.spouseRdo || "");
  put("rdoPg2I68SpouseTypeS", rb(d.spouseType === "single"), true);
  put("rdoPg2I68SpouseTypeP", rb(d.spouseType === "prof"), true);
  put("txtPg2I70SpouseName", d.spouseName || "");

  // ---- meta / package fields (mirrors eBIRForms tail) ----
  put("txtCurrentPage", "1", true);
  put("txtMaxPage", "2", true);
  put("txtIsTaxFilerDisabled", "FALSE", true);
  put("txtVersion", "2018A", true);
  putRaw("txtFinalFlag", filing.status === "filed" ? "1" : "0");
  putRaw("txtEnroll", "Y");
  putRaw("driveSelectTPExport", "0");

  // ---- assemble ----
  const body = rows
    .map(([k, v]) => "            <div>" + k + "=" + v + k + "=</div>\t")
    .join("\n");
  return "<?xml version='1.0'?>\t\n" + body + "\n            \t\n            All Rights Reserved BIR 2012.0";
}

/** Canonical eBIRForms filename for a 1701A export. */
export function fileName(filing: Filing, tp: Taxpayer | null): string {
  const t = tinParts(tp);
  const yr = parseYear((filing.data || {}).year);
  return (
    t.t1 + t.t2 + t.t3 + t.branch.padStart(3, "0").slice(0, 3) +
    "-1701Av2018-" + yr.mm + (yr.yyyy || "") + ".xml"
  );
}

/** Trigger a browser download of an XML string (no-op outside the browser). */
export function download(filename: string, text: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([text], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

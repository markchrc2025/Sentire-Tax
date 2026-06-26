// build1702Q.ts — authentic eBIRForms XML export for BIR Form 1702Q
// (Quarterly Income Tax Return for Corporations/Partnerships/Non-Individuals).
// Field keys, namespaces, CRLF/tab assembly and tail reproduce a real
// eBIRForms 1702Q offline-package export. Pure (same bytes for same inputs).
//
// 1702Q quirks (reproduced exactly from the authentic sample):
//   * MOST fields use the `frm1702q:` namespace, BUT the method-of-deduction
//     radios use a bare `1702q:` prefix (no "frm"): 1702q:OptMethodDeduct_1/_2.
//   * Several keys carry a LITERAL colon before the suffix:
//       frm1702q:itemFiscalStartMonth:_1/_2, frm1702q:optQtr:_1/_2/_3,
//       frm1702q:optTreaty:_1/_2.
//   * The amended radios are mis-spelled "Remender": optRemenderRtn_1/_2.
//   * TIN parts use lowercase "Tin": txtTin1/2/3.
//   * txtAtc carries a TRAILING SPACE: default "IC010 " (note the space).
//   * Globals (no namespace): Codename1..18 (Codename1=true, rest false),
//     txt1stQtr/2ndQtr/3rdQtr/Total, txtTaxRate ("2%"), txtMinCorpIncomeTax,
//     txtFinalFlag, txtEnroll, ebirOnline*, txtEmail, driveSelectTPExport.
//   * Tail year is "BIR 2012.0" (not 2014.0); each <div> ends with a bare TAB.

import type { Filing, Taxpayer } from "../../types";
import type { Comp1702Q } from "../compute";
import { amt, enc, parseYear, rb, tinParts, type XmlRow } from "./xmlkit";
import { parsePeriod } from "../period";

const NS = "frm1702q:";

/** Registered name for a company (or "LAST, FIRST" fallback for individuals). */
function regName(tp: Taxpayer | null): string {
  if (!tp) return "";
  if (tp.kind === "individual") return [tp.lastName, tp.firstName].filter(Boolean).join(", ");
  return tp.regName || "";
}

/** Build the authentic 1702Q eBIRForms XML string. */
export function build1702Q(filing: Filing, tp: Taxpayer | null, comp: Comp1702Q): string {
  const d = filing.data || {};
  const t = tinParts(tp);
  const yr = parseYear(d.year);
  const rdo = (tp && tp.rdo) || "";
  const calendar = d.periodType !== "fiscal"; // default calendar
  const itemized = (d.method as string) !== "osd"; // default itemized
  const name = regName(tp);

  // Quarter: prefer the structured filing.period ("2025-Q2"); fall back to the
  // form's `quarter` field ("1st"/"2nd"/"3rd"). 1702Q has only Q1..Q3.
  const { quarter } = parsePeriod(filing.period || "");
  const qFromData = ((): string => {
    const q = String(d.quarter || "");
    if (q.startsWith("1")) return "Q1";
    if (q.startsWith("2")) return "Q2";
    if (q.startsWith("3")) return "Q3";
    return "";
  })();
  const q = quarter || qFromData || "Q1";

  const rows: XmlRow[] = [];
  /** namespaced (frm1702q:) field, value emitted verbatim. */
  const P = (key: string, val: string) => rows.push([NS + key, val]);
  /** global field (no namespace), verbatim. */
  const G = (key: string, val: string) => rows.push([key, val]);
  /** bare 1702q: namespace (no "frm" prefix) — method radios only. */
  const M = (key: string, val: string) => rows.push(["1702q:" + key, val]);
  /** peso-formatted amount field ("0.00" when zero, comma-formatted otherwise). */
  const A = (key: string, n: number) => P(key, amt(n));

  // ---- Period / fiscal-or-calendar (literal colon in the key) ----
  P("itemFiscalStartMonth:_1", rb(calendar));
  P("itemFiscalStartMonth:_2", rb(!calendar));

  // ---- Quarter (literal colon; Q1..Q3) ----
  P("optQtr:_1", rb(q === "Q1"));
  P("optQtr:_2", rb(q === "Q2"));
  P("optQtr:_3", rb(q === "Q3"));

  // ---- Amended return (mis-spelled "Remender"; _1=yes, _2=no) ----
  P("optRemenderRtn_1", rb(d.amended === "yes"));
  P("optRemenderRtn_2", rb(d.amended !== "yes"));

  // ---- Sheets / year-end ----
  P("txtSheets", String(d.sheets || "0"));
  P("itemYearEndMonth", "12");
  P("txtYearEnded", yr.yyyy);

  // ---- TIN (lowercase "Tin") + branch + RDO ----
  P("txtTin1", t.t1);
  P("txtTin2", t.t2);
  P("txtTin3", t.t3);
  P("txtBranchCode", t.branch3);
  P("txtRdoCode", rdo);

  // ---- Line of business / name / contact / address (URL-encoded) ----
  P("txtDescription", enc((tp && tp.classification) || d.lineBus || ""));
  P("txtTaxpayerName", enc(name));
  P("txtTelNum", (tp && tp.phone) || "");
  P("txtTaxPayerAdd", enc(tp ? [tp.address, tp.city].filter(Boolean).join(" ") : ""));
  P("txtTaxPayerZip", (tp && tp.zip) || "");

  // ---- Method of deductions (BARE 1702q: namespace, no "frm") ----
  M("OptMethodDeduct_1", rb(itemized));
  M("OptMethodDeduct_2", rb(!itemized));

  // ---- Tax treaty (literal colon; default: no treaty → _2=true) ----
  P("optTreaty:_1", rb(d.treaty === "yes"));
  P("optTreaty:_2", rb(d.treaty !== "yes"));
  P("lstTaxTreaty", "0");

  // ---- ATC (trailing space is authentic — keep it) ----
  P("txtAtc", (d.atc as string) || "IC010 ");

  // ---- Schedule / Part II amount fields (txt16A..txt34) ----
  // The app captures only the regular-rate Schedule 2 + Part II totals; map the
  // identifiable ones, emit "0.00" for the rest. Column B at item 25 carries the
  // 2% MCIT rate context in the sample (30.00 there from a 30% regular rate); we
  // emit "0.00" unless computed, matching the conservative RT behaviour.
  A("txt16A", 0); // sales/receipts (special-rate columns A/B/C)
  A("txt16B", 0);
  A("txt16C", 0);
  A("txt17A", 0);
  A("txt17B", 0);
  A("txt17C", 0);
  A("txt18A", 0);
  A("txt18B", 0);
  A("txt18C", 0);
  A("txt19A", 0);
  A("txt19B", 0);
  A("txt20A", 0);
  A("txt20B", 0);
  A("txt20C", 0);
  A("txt21A", 0);
  A("txt21B", 0);
  A("txt21C", 0);
  A("txt22A", 0);
  A("txt22B", 0);
  A("txt23A", 0);
  A("txt23B", 0);
  A("txt24A", 0);
  A("txt24B", 0);
  A("txt25A", 0);
  // txt25B holds the regular income-tax-rate cell (authentic sample shows the
  // 30% filer's rate as "30.00"); derive it from the computed regular rate.
  A("txt25B", comp.rate);
  A("txt26A", 0);
  A("txt26B", 0);
  A("txt27", 0);
  A("txt28", 0);
  A("txt29A", 0);
  A("txt29B", 0);
  A("txt29C", 0);
  A("txt29D", 0);
  A("txt30", 0);
  A("txt31A", 0);
  A("txt31B", 0);
  A("txt31C", 0);
  A("txt31D", 0);
  A("txt31E", 0);
  A("txt31F", 0);
  P("txt31Gothers", "");
  A("txt31G", 0);
  A("txt31H", 0);
  A("txt32", 0);
  A("txt33A", 0);
  A("txt33B", 0);
  A("txt33C", 0);
  A("txt33D", 0);
  A("txt34", 0);

  // ---- Globals: Codename1..18 (Codename1=true, the rest false) ----
  for (let i = 1; i <= 18; i++) G(`Codename${i}`, rb(i === 1));

  // ---- Globals: quarterly MCIT carry-forward + rate ----
  G("txt1stQtr", amt(0));
  G("txt2ndQtr", amt(0));
  G("txt3rdQtr", amt(0));
  G("txtTotal", amt(0));
  G("txtTaxRate", "2%");
  G("txtMinCorpIncomeTax", amt(comp.mcit));

  // ---- Globals: package / enrollment tail ----
  G("txtFinalFlag", filing.status === "draft" ? "0" : "1");
  G("txtEnroll", "Y");
  G("ebirOnlineConfirmUsername", "");
  G("ebirOnlineUsername", "");
  G("ebirOnlineSecret", "");
  G("txtEmail", (tp && tp.email) || "");
  G("driveSelectTPExport", "0");

  // ---- assemble (12-space lead, TAB+CR per div, CRLF lines, BIR 2012.0 tail) ----
  // The authentic sample uses CRLF endings: each <div> ends with TAB+CR, lines
  // are joined by LF, and the head/tail carry TAB+CR+LF.
  const lead = "            ";
  const trail = "\t\r";
  const sep = "\n";
  const head = "<?xml version='1.0'?>\t\r\n";
  const body = rows.map(([k, v]) => `${lead}<div>${k}=${v}${k}=</div>${trail}`).join(sep);
  const tail = `${lead}\t\r\n${lead}All Rights Reserved BIR 2012.0`;
  return `${head}${body}${sep}${tail}`;
}

/** eBIRForms filename: <tin><branch>1702Q<yyyy><Qn>.xml (no v2018, no mm). */
export function fileName1702Q(filing: Filing, tp: Taxpayer | null): string {
  const t = tinParts(tp);
  const yr = parseYear((filing.data || {}).year);
  const { year, quarter } = parsePeriod(filing.period || "");
  const yyyy = year || yr.yyyy;
  const qFromData = ((): string => {
    const q = String((filing.data || {}).quarter || "");
    if (q.startsWith("1")) return "Q1";
    if (q.startsWith("2")) return "Q2";
    if (q.startsWith("3")) return "Q3";
    return "";
  })();
  const qn = quarter || qFromData || "Q1";
  return `${t.t1}${t.t2}${t.t3}${t.branch3}1702Q${yyyy}${qn}.xml`;
}

// Re-export the shared download helper so existing imports keep working.
export { download } from "./xmlkit";

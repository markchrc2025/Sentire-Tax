// parseCor.ts — pure layout parser for BIR Form 2303 (Certificate of
// Registration) OCR text. No IO / browser deps, so it's unit-testable and
// shared by the browser extractor (extractCor.ts).
//
// OCR of a scanned, watermarked COR is inherently imperfect — callers MUST let
// the user review/correct the result before applying it.

import type { TaxType, TaxpayerKind } from "../../types";

/** Fields parsed from a COR — every field is best-effort and may be empty. */
export interface ExtractedCor {
  kind?: TaxpayerKind;
  regName?: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  tradeName?: string;
  tin?: string; // 9 digits, no dashes
  branch?: string; // up to 5 digits
  rdo?: string; // 3-digit RDO code
  address?: string;
  zip?: string;
  taxTypes: TaxType[];
  rawText: string;
}

const TAX_TYPE_KEYWORDS: Array<[RegExp, string]> = [
  [/VALUE[\s-]*ADDED\s*TAX|\bVAT\b/, "Value-Added Tax"],
  [/PERCENTAGE\s*TAX/, "Percentage Tax"],
  [/REGISTRATION\s*FEE/, "Registration Fee"],
  [/WITHHOLDING.*COMPENSATION/, "Withholding Tax - Compensation"],
  [/WITHHOLDING.*(EXPANDED|CREDITABLE)/, "Withholding Tax - Expanded"],
  [/WITHHOLDING.*FINAL/, "Withholding Tax - Final"],
  [/DOCUMENTARY\s*STAMP/, "Documentary Stamp Tax"],
  [/INCOME\s*TAX/, "Income Tax"], // keep last — most generic
];
const FORM_RE = /\b(1701Q|1701A|1702RT|1702Q|2550Q|2550M|2551Q|2551M|1601C|1601EQ|0619E|1701|1702|0605|2000)\b/;
const FREQ_RE = /\b(ANNUALLY|QUARTERLY|MONTHLY)\b/;
const COMPANY_RE = /\b(INC\.?|INCORPORATED|CORP\.?|CORPORATION|COMPANY|CO\.?|ENTERPRISES?|PARTNERSHIP|OPC|FOUNDATION|ASSOCIATION|COOPERATIVE)\b/;
const TIN_RE = /\d{3}\s*[-–—]?\s*\d{3}\s*[-–—]?\s*\d{3}\s*(?:[-–—]\s*\d{3,5})?/g;
const DATE_RE =
  /\b(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEP(?:T(?:EMBER)?)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)\s+\d{1,2},?\s+\d{4}\b/g;
// Column headers / boilerplate that must never be mistaken for a field value.
const HEADER_NOISE_RE =
  /\bTIN\b|ISSUANCE|BRANCH\s*CODE|\bDATE\b|REGISTERING\s*OFFICE|HEAD\s*OFFICE|\bBRANCH\b|\(PSIC\)/g;

/** Pull the text following a label, on the same line or the next non-empty one. */
function valueAfter(lines: string[], labelRe: RegExp): string {
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(labelRe);
    if (!m) continue;
    const tail = lines[i].slice((m.index ?? 0) + m[0].length).replace(/^[\s:.\-|]+/, "").trim();
    if (tail.length >= 2) return tail;
    for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
      const nxt = lines[j].trim();
      if (nxt.length >= 2) return nxt;
    }
  }
  return "";
}

/** Strip TIN runs, dates and header words so a candidate string is just a name. */
function cleanName(strs: string): string {
  return strs
    .replace(TIN_RE, " ")
    .replace(DATE_RE, " ")
    .replace(HEADER_NOISE_RE, " ")
    .replace(/[|]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Parse OCR text from a BIR Form 2303 into structured fields. */
export function parseCorText(raw: string): ExtractedCor {
  const text = raw.toUpperCase();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s{2,}/g, " ").trim())
    .filter(Boolean);
  const out: ExtractedCor = { taxTypes: [], rawText: raw };

  // --- TIN + branch: 9 digits, optionally followed by a 3-5 digit branch ---
  const tinMatch = text.match(/\b(\d{3})\s*[-–—]?\s*(\d{3})\s*[-–—]?\s*(\d{3})\s*(?:[-–—]\s*(\d{3,5}))?\b/);
  if (tinMatch) {
    out.tin = tinMatch[1] + tinMatch[2] + tinMatch[3];
    if (tinMatch[4]) out.branch = tinMatch[4];
  }

  // --- RDO code: "REVENUE DISTRICT OFFICE NO. 045" ---
  const rdo = text.match(/DISTRICT\s*OFFICE\s*NO\.?\s*(\d{2,3})/);
  if (rdo) out.rdo = rdo[1].padStart(3, "0");

  // --- Name of taxpayer ---
  // The COR header row is three columns (TIN | NAME | ISSUANCE DATE), so the
  // name lives on the value line mixed with the TIN and a date. Read that line
  // and strip the TIN/date/header noise; fall back to the labelled value.
  let nameCand = "";
  // Match the dash-formatted TIN line specifically — this avoids the OCN line
  // (e.g. "045RC2023…") whose long digit run looks TIN-ish without dashes.
  const tinLineIdx = lines.findIndex((l) => /\d{3}-\d{3}-\d{3}/.test(l));
  if (tinLineIdx >= 0) nameCand = cleanName(lines[tinLineIdx]);
  if (nameCand.replace(/[^A-Z]/g, "").length < 3) {
    nameCand = cleanName(valueAfter(lines, /NAME\s*OF\s*TAXPAYER/));
  }
  if (nameCand.replace(/[^A-Z]/g, "").length >= 3) {
    if (COMPANY_RE.test(nameCand)) {
      out.kind = "non-individual";
      out.regName = nameCand;
    } else if (nameCand.includes(",")) {
      out.kind = "individual";
      const ci = nameCand.indexOf(",");
      out.lastName = nameCand.slice(0, ci).trim();
      out.firstName = nameCand.slice(ci + 1).trim();
    } else {
      out.regName = nameCand; // unknown shape — keep for review
    }
  }

  // --- Trade name (Business Information Details) ---
  const trade = valueAfter(lines, /TRADE\s*NAME(?:\s*\d+)?(?:\s*\(PSIC\))?/);
  if (trade && !/LINE\s*OF\s*BUSINESS|^\(?PSIC\)?$|CATEGORY|REGISTRATION\s*DATE/.test(trade)) {
    out.tradeName = trade.replace(/\(PSIC\)/g, "").replace(/\s{2,}/g, " ").trim();
  }

  // --- Registered address + ZIP ---
  const addr = valueAfter(lines, /REGISTERED\s*ADDRESS/);
  if (addr) {
    out.address = addr;
    const zip = addr.match(/\b(\d{4})\b/);
    if (zip) out.zip = zip[1];
  }

  // --- Tax Types table (best effort) ---
  // Bound the scan to the table region so the REMINDERS prose (which mentions
  // "income tax return … 2551Q … quarterly") can't manufacture phantom rows.
  let lo = lines.findIndex((l) => /\bTAX\s*TYPES?\b/.test(l));
  if (lo < 0) lo = 0;
  let hi = lines.findIndex(
    (l, idx) => idx > lo && /(REMINDERS|TAXPAYER\s*TYPE|BUSINESS\s*INFORMATION|HEREBY\s*CERTIFY|THIS\s*CERTIFICATE)/.test(l),
  );
  if (hi < 0) hi = lines.length;

  const seen = new Set<string>();
  for (let i = lo; i < hi; i++) {
    const window = (lines[i] + " " + (lines[i + 1] || "")).toUpperCase();
    let type = "";
    for (const [re, label] of TAX_TYPE_KEYWORDS) {
      if (re.test(lines[i])) {
        type = label;
        break;
      }
    }
    if (!type) continue;
    const form = window.match(FORM_RE)?.[1] ?? "";
    const freqRaw = window.match(FREQ_RE)?.[1] ?? "";
    const frequency = freqRaw ? freqRaw[0] + freqRaw.slice(1).toLowerCase() : "";
    const key = type + "|" + form;
    if (seen.has(key)) continue;
    seen.add(key);
    out.taxTypes.push({ type, form, frequency, startDate: "" });
  }

  return out;
}

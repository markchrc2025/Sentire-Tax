// Parser tests for the COR OCR extractor. The OCR engine itself isn't tested
// here (it runs in the browser); these lock down parseCorText against the REAL
// text the deployed app produces. NICHIEVAN and MCRC below are the verbatim
// Tesseract output of two scanned CORs put through the app's EXACT browser
// pipeline — pdf.js rasterize at scale 2.4, the app's canvas binarize at
// threshold 160, and the same standard "eng" model the browser loads from the
// CDN (reproduced in Node via @napi-rs/canvas; see scratch harness).
//
// These carry the brutal real-world cases: table cells whose type column was
// entirely destroyed (leaving only "ANNUALLY"), a trade name whose LABEL failed
// OCR (Nichievan — value on a bare line) and one whose VALUE failed OCR (MCRC —
// label + date only), plus form codes bleeding after due dates ("...15 0605").

import { describe, expect, it } from "vitest";
import { parseCorText } from "../parseCor";

// Real browser-pipeline OCR — Nichievan Variety Store (the "TRADE NAME 1"
// label was lost; the value survives on its own line 31).
const NICHIEVAN = `~~
BIR FORM Iq SE
2303 REPUBLIKA NG FILIPINAS
KAGAINARANNES PAN PI
REVISED: APRIL 2019 KAWAI “NG: [<0 RNAS
REVENUE REGI! 078 ~EAST NCR
REVENUE DISTRIC FFG] a - CAINTA-TAYTAY
~~ OCN: 046RC20240000001287
Date OCN Generated: February 7, 2024
CERTIFICATE OF REGISTRATION }
TIN & BRANCH CODE NAME OF TAXPAYER
494-097-354-00000 GREGORIO, NICOLE REYES December 21, 2016
| REGISTERINGOFFICE __ [X [HeadOfice | [Branch
REGISTERED ADDRESS
2 PASCO ST. COR. FELIX MANALO AVE. SAN ISIDRO 1900 CAINTA RIZAL PHILIPPINES oo
TAX TYPES FORM FILING FILING FILING DUE DATE
TYPES | START DATE FREQUENCY
On or before April 15 of each 7]
INDIVIDUAL INCOME | 1701/17 | January 1, ANNUALLY year covering income for the
TAX 01A 2025 preceding taxable year.
1st Quarnter-on or bafora MAY 15
February 7, 2nd Quarter-on or before
INDIVIDUEL INCOME 1701Q 2024 QUARTERLY AUGUST 15 3rd Quarter-on or
before November 15
— 1
ENTAGE TAX - February 7, Within twenty five (25) days after
FE GUARTERLY ssa | 2024 QUARTERLY the end of each taxable quarter.
TAXPAYER TYPE/S SINGLE PROPRIETORSHIP ONLY (RESIDENT CITIZEN)
BUSINESS INFORMATION DETAILS _
_ CATEGORY REGISTRATION DATE
NICHIEVAN VARIETY STORE
{PSIC) 47739-OTHER RETAIL SALE OF NEW
GOODS IN SPECIALIZED STORES, N.E. .
C. Primary
VARIETY STORE ] ~
REMINDERS:
1. An annual registration fee shall be paid upon registration and every year thereafter on or before the last day
of January, using BIR Form No. 0605.
5. For Self-Employed Individuals (SEI) whose gross sales and/or receipts and other non-operating income
does not exceed P3,000,000 and who opted to avail of the 8% Income tax rate, the tax type Percentage Tax
(PT) shall not be reflected. required to file quarterly percentage tax return (BIR Form No. 2551Q) QUARTERLY.`;

// Real browser-pipeline OCR — MCRC Tax and Accounting Services (the trade-name
// VALUE failed OCR entirely; only "TRADE NAME 1 February 3. 2022" survives, so
// the trade name must come back EMPTY — never the Line of Business below it).
const MCRC = `BIR FORM - To
2303 REPUBLIKA NG PILIPINAS
REVISED: APRIL 2019 canadian NG. RENTAS MWERNAS
REVENUE DISTRICT ICE NQi 045 - MARIKINA
hid OCN: 045RC20230000007782
Date OCN Generated: June 13, 2023
CERTIFICATE OF REGISTRATION
TIN & BRANCH CODE NAME OF TAXPAYER TIN ISSUANCE DATE
474-079-835-00000 CANLUBO, CHRISTIAN RIGOR August 25, 2015
REGISTERING OFFICE X | Head Office Branch
REGISTERED ADDRESS
#80 DRAGON ST. SAN ROQUE 1801 CITY OF MARIKINA NCR. SECOND DISTRICT PHILIPPINES
TAX TYPES FORM FILING FILING FILING DUE DATE
TYPES | START DATE FREQUENCY
On or before April 15 of each
ANNUALLY year covering income for the
preceding taxable year.
1st Quarter-on or before MAY 15
INDIVIDUAL INCOME February 3, 2nd Quarter-on or before
TAX 1701Q 2022 QUARTERLY AUGUST 15 3rd Quarter-on or
before November 15
0605 March 7. 2022 On or betare the last day of
Not later than the 25th day
VALUE ADDED TAX QUARTERLY following the close of gach
_ taxable quarter.
TAXPAYER TYPE/S SINGLE PROPRIETORSHIP ONLY (RESIDENT CITIZEN)
BUSINESS INFORMATION DETAILS _
REGISTRATION DATE _
TRADE NAME 1 February 3. 2022
69200-ACCOUNTING, BOOKKEEPING
AND AUDITING ACTIVITIES: TAX
CONSULTANCY Prima
Line of Business | ACCOUNTING, BOOKKEPING AND id
AUDITING ACTIVITIES: TAX
REMINDERS:
1. An annual registration fee shall be paid using BIR Form No. 0605.`;

describe("parseCorText — real browser pipeline, Nichievan Variety Store", () => {
  const r = parseCorText(NICHIEVAN);

  it("reads TIN, branch and RDO (RDO from the OCN — the header is seal-damaged)", () => {
    expect(r.tin).toBe("494097354");
    expect(r.branch).toBe("00000");
    expect(r.rdo).toBe("046");
  });

  it("splits the individual name into last / first / middle", () => {
    expect(r.kind).toBe("individual");
    expect(r.lastName).toBe("GREGORIO");
    expect(r.firstName).toBe("NICOLE");
    expect(r.middleName).toBe("REYES");
  });

  it("reads the address, trims the trailing OCR junk ('oo'), extracts ZIP", () => {
    expect(r.address).toContain("PASCO ST");
    expect(r.address?.endsWith("PHILIPPINES")).toBe(true);
    expect(r.zip).toBe("1900");
  });

  it("recovers the trade name even though its LABEL failed OCR", () => {
    expect(r.tradeName).toBe("NICHIEVAN VARIETY STORE");
  });

  it("extracts all three tax-type rows despite wrapped/mangled cells", () => {
    const keys = r.taxTypes.map((t) => `${t.type}|${t.form}|${t.frequency}`);
    expect(keys).toContain("Income Tax|1701|Annually");
    expect(keys).toContain("Income Tax|1701Q|Quarterly");
    expect(keys).toContain("Percentage Tax|2551Q|Quarterly");
    expect(r.taxTypes.length).toBe(3);
  });

  it("does not invent tax types from the REMINDERS prose", () => {
    expect(r.taxTypes.some((t) => t.type === "Registration Fee")).toBe(false);
  });
});

describe("parseCorText — real browser pipeline, MCRC (value-loss cases)", () => {
  const r = parseCorText(MCRC);

  it("reads TIN, branch and RDO", () => {
    expect(r.tin).toBe("474079835");
    expect(r.branch).toBe("00000");
    expect(r.rdo).toBe("045");
  });

  it("splits the individual name into last / first / middle", () => {
    expect(r.kind).toBe("individual");
    expect(r.lastName).toBe("CANLUBO");
    expect(r.firstName).toBe("CHRISTIAN");
    expect(r.middleName).toBe("RIGOR");
  });

  it("leaves the trade name EMPTY when its value failed OCR (never grabs Line of Business)", () => {
    expect(r.tradeName ?? "").toBe("");
  });

  it("extracts the tax-type rows OCR left legible (no phantom year from '...15 0605')", () => {
    const keys = r.taxTypes.map((t) => `${t.type}|${t.form}`);
    expect(keys).toContain("Income Tax|1701Q");
    expect(keys).toContain("Value-Added Tax|2550Q");
    // No row may carry an implausible start date parsed from a form code.
    expect(r.taxTypes.every((t) => !t.startDate || /^(19|20)\d\d-/.test(t.startDate))).toBe(true);
  });
});

describe("parseCorText — synthetic clean scan", () => {
  const CLEAN = `
REVENUE DISTRICT OFFICE NO. 045 - MARIKINA
OCN: 045RC20230000007782
CERTIFICATE OF REGISTRATION
TIN & BRANCH CODE   NAME OF TAXPAYER   TIN ISSUANCE DATE
474-079-835-00000   CANLUBO, CHRISTIAN RIGOR   August 25, 2015
REGISTERED ADDRESS
#80 DRAGON ST. SAN ROQUE 1801 CITY OF MARIKINA NCR, SECOND DISTRICT PHILIPPINES
TAX TYPES   FORM TYPES   FILING START DATE   FILING FREQUENCY
INDIVIDUAL INCOME TAX   1701/1701A   January 1, 2023   ANNUALLY
INDIVIDUAL INCOME TAX   1701Q   February 3, 2022   QUARTERLY
REGISTRATION FEE   0605   March 7, 2022
VALUE ADDED TAX   2550Q   June 13, 2023   QUARTERLY
TAXPAYER TYPE/S   SINGLE PROPRIETORSHIP ONLY (RESIDENT CITIZEN)
BUSINESS INFORMATION DETAILS
TRADE NAME 1 (PSIC)   MCRC TAX AND ACCOUNTING SERVICES
Line of Business   ACCOUNTING, BOOKKEEPING AND AUDITING ACTIVITIES
REMINDERS:
Such SEI shall be required to file quarterly income tax return (BIR Form No. 2551Q). QUARTERLY.
`;
  const r = parseCorText(CLEAN);

  it("reads the form codes straight from the table when legible", () => {
    const keys = r.taxTypes.map((t) => `${t.type}|${t.form}`);
    expect(keys).toContain("Income Tax|1701");
    expect(keys).toContain("Income Tax|1701Q");
    expect(keys).toContain("Registration Fee|0605");
    expect(keys).toContain("Value-Added Tax|2550Q");
    expect(r.taxTypes.length).toBe(4);
    expect(r.taxTypes.find((t) => t.form === "1701")?.startDate).toBe("2023-01-01");
  });

  it("does not invent tax types from the REMINDERS prose", () => {
    expect(r.taxTypes.some((t) => t.form === "2551Q")).toBe(false);
  });

  it("reads the trade name past the (PSIC) tag", () => {
    expect(r.tradeName).toBe("MCRC TAX AND ACCOUNTING SERVICES");
  });

  it("detects a company name as non-individual", () => {
    const c = parseCorText("NAME OF TAXPAYER\n123-456-789-00000 AURORA DIGITAL SOLUTIONS INC. June 1, 2020");
    expect(c.kind).toBe("non-individual");
    expect(c.regName).toContain("AURORA DIGITAL SOLUTIONS INC.");
  });
});

// Regressions for defects confirmed by adversarial review of the parser.
describe("parseCorText — adversarial cases", () => {
  const TABLE = (rows: string) =>
    `TAX TYPES FORM TYPES FILING START DATE FILING FREQUENCY\n${rows}\nTAXPAYER TYPE/S SINGLE PROPRIETORSHIP\nREMINDERS:`;

  it("does not mistake a year-2000 start date for the DST form code 2000", () => {
    const r = parseCorText(TABLE("VALUE ADDED TAX 255OQ June 1, 2000 QUARTERLY"));
    expect(r.taxTypes).toEqual([
      { type: "Value-Added Tax", form: "2550Q", frequency: "Quarterly", startDate: "2000-06-01" },
    ]);
  });

  it("still reads a real Documentary Stamp Tax row's 2000 form", () => {
    const r = parseCorText(TABLE("DOCUMENTARY STAMP TAX 2000 June 1, 2019 MONTHLY"));
    expect(r.taxTypes).toEqual([
      { type: "Documentary Stamp Tax", form: "2000", frequency: "Monthly", startDate: "2019-06-01" },
    ]);
  });

  it("keeps adjacent withholding rows' forms on the right rows", () => {
    const r = parseCorText(
      TABLE("WITHHOLDING TAX - COMPENSATION 1601C MONTHLY WITHHOLDING TAX - EXPANDED 0619E MONTHLY"),
    );
    const keys = r.taxTypes.map((t) => `${t.type}|${t.form}|${t.frequency}`);
    expect(keys).toContain("Withholding Tax - Compensation|1601C|Monthly");
    expect(keys).toContain("Withholding Tax - Expanded|0619E|Monthly");
    expect(r.taxTypes.length).toBe(2);
  });

  it("anchors qualifier-first withholding rows (EXPANDED/FINAL WITHHOLDING TAX)", () => {
    const r = parseCorText(
      TABLE("EXPANDED WITHHOLDING TAX 0619E MONTHLY FINAL WITHHOLDING TAX 0619F MONTHLY"),
    );
    const keys = r.taxTypes.map((t) => `${t.type}|${t.form}`);
    expect(keys).toContain("Withholding Tax - Expanded|0619E");
    expect(keys).toContain("Withholding Tax - Final|0619F");
  });

  it("keeps a name suffix out of the middle-name slot", () => {
    const r = parseCorText("NAME OF TAXPAYER\n123-456-789-00000 DELA CRUZ, JUAN REYES JR. May 5, 2010");
    expect(r.kind).toBe("individual");
    expect(r.lastName).toBe("DELA CRUZ");
    expect(r.firstName).toBe("JUAN JR.");
    expect(r.middleName).toBe("REYES");
  });

  it("keeps PRIMARY inside a legitimate trade name (end-anchored CATEGORY strip)", () => {
    const r = parseCorText(
      "BUSINESS INFORMATION DETAILS\nTRADE NAME 1 PRIMARY CARE PHARMACY February 7, 2024\n69200-RETAIL",
    );
    expect(r.tradeName).toBe("PRIMARY CARE PHARMACY");
    const glued = parseCorText(
      "BUSINESS INFORMATION DETAILS\nTRADE NAME 1 NICHIE STORE Primary February 7, 2024\n47739-RETAIL",
    );
    expect(glued.tradeName).toBe("NICHIE STORE");
  });

  it("treats an individual whose middle name is CO as an individual", () => {
    const r = parseCorText("NAME OF TAXPAYER\n123-456-789-00000 SANTOS, MARIA CO May 5, 2010");
    expect(r.kind).toBe("individual");
    expect(r.lastName).toBe("SANTOS");
    expect(r.firstName).toBe("MARIA");
    expect(r.middleName).toBe("CO");
  });

  it("still detects comma-less '& CO.' company names", () => {
    const r = parseCorText("NAME OF TAXPAYER\n123-456-789-00000 SMITH BELL & CO. May 5, 2010");
    expect(r.kind).toBe("non-individual");
    expect(r.regName).toContain("SMITH BELL & CO.");
  });
});

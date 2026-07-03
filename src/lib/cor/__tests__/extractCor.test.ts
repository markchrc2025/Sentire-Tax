// Parser tests for the COR OCR extractor. The OCR engine itself isn't tested
// here (it runs in the browser); these lock down parseCorText against REAL
// Tesseract output from two scanned CORs, produced through the app's exact
// pipeline (render at scale 2.4, binarize at threshold 160, eng model), plus
// a synthetic clean-scan fixture. The real fixtures carry the hard cases:
// wrapped table cells ("INDIVIDUAL INCOME" / "TAX 01A"), OCR-mangled keywords
// ("INDIVIDUEL", "NTAGE TAX", "NCOME"), seal-destroyed RDO headers, and
// registration dates glued to the trade name.

import { describe, expect, it } from "vitest";
import { parseCorText } from "../parseCor";

// Real Tesseract output — Nichievan Variety Store COR (grainy photocopy).
const NICHIEVAN = `
BIR FORM yf ERA)
2303 REP BLK) No HE TAINAS
KAGAIVARA PAN PI
REVISED: APRIL 2019 KAWA| NG: TAS: RNAS
REVENUE REGIC 078 “EAST NCR
REVENUE DISTRIC FF i - CAINTA-TAYTAY
SRI
r OCN: 046RC20240000001287
Date OCN Generated: February 7, 2024
CERTIFICATE OF REGISTRATION
TIN & BRANCH CODE NAME OF TAXPAYER TT
494-097-354-00000 GREGORIO, NICOLE REYES December 21, 2016
REGISTERING OFFICE |x [HeadOfice | [Bam
REGISTERED ADDRESS
2 PASCO ST. COR. FELIX MANALO AVE. SAN ISIDRO 1900 CAINTA RIZAL PHILIPPINES OO
TAX TYPES FORM FILING FILING FILING DUE DATE
TYPES | START DATE FREQUENCY
On or before April 150feach
INDIVIDUAL INCOME 170/17 January 1, ANNUALLY year covering income for the
TAX 01A 2025 preceding taxable year.
1st Quarter-on or bafora MAY 15
February 7, 2nd Quarter-on or before
INDIVIDUEL INCOME 1701Q 2024 QUARTERLY AUGUST 15 3rd Quarter-on or
before November 15
NTAGE TAX - February 7, Within twenty five (25) days after
PE CUARTERLY ssa | 2024 QUARTERLY the end of each taxable quarter.
TAXPAYER TYPE/S SINGLE PROPRIETORSHIP ONLY (RESIDENT CITIZEN)
BUSINESS INFORMATION DETAILS
CATEGORY REGISTRATION DATE
TRADE NAME 1 NICHIEVAN VARIETY STORE February 7, 2024
{PSIC) 47739-OTHER RETAIL SALE OF NEW
GOODS IN SPECIALIZED STORES, N.E. Pri
C. rimary
Line of Business | VARIETY STORE _
REMINDERS:
1. An annual registration fee shall be paid upon registration and every year thereafter on or before the last day
of January, using BIR Form No. 0605.
2. Filing of required tax return/s to conform with the above tax types, whether with or without business
operation, to avoid penalties.
5. For Self-Employed Individuals (SEI) whose gross sales and/or receipts and other non-operating income
does not exceed P3,000,000 and who opted to avail of the 8% Income tax rate, the tax type Percentage Tax
(PT) shall not be reflected in the Certificate of Registration (COR). However, at the start of each taxable
year, such SE} shall be automatically subjected to graduated income tax rates and required to file quarterly
percentage tax return (BIR Form No. 2551Q) and option to replace the COR to reflect "PT", unless qualified
and opted to avail of the 8% Income tax rate annually. 0000000
`;

// Real Tesseract output — MCRC Tax and Accounting Services COR.
const MCRC = `
BIR FORM > 7.
2303 REPUBLIKA NG PILIPINAS
KAGAWARAN'NG PANANALAPI
REVISED: APRIL 2019 KAWANIHAN NG BENTAS INTERNAS
REVENUE a 11 078 - EAST NCR
REVENUE DISTRICT FICE NOY 045 - MARIKINA
hi OCN: 045RC20230000007782
Date OCN Generated: June 13, 2023
CERTIFICATE OF REGISTRATION
TIN & BRANCH CODE NAME OF TAXPAYER TIN ISSUANCE DATE
474-079-835-00000 CANLUBO, CHRISTIAN RIGOR August 25, 2015
REGISTERING OFFICE _ |X | Head Office Branch ~~
REGISTERED ADDRESS
#80 DRAGON ST. SAN ROQUE 1801 CITY OF MARIKINA NCR, SECOND DISTRICT PHILIPPINES
TAX TYPES FORM FILING FILING FILING DUE DATE
TYPES | START DATE FREQUENCY
oo On or before April 15 of each
INDIVIDUAL! NCOME BAA 7 Janey ' ANNUALLY year covering income for the
preceding taxable year.
1st Quarter-on or before MAY 15
INDIVIDUAL INCOME February 3, 2nd Quarter-on or before
TAX 1701Q 2022 | QUARTERLY AUGUST 15 3rd Quarter-on or
oo before November 15
REGISTRATION FEE | 0605 | March7,2022 On or before the last day of
Not later than the 25th day
VALUE ADDED TAX 2550Q | June 13, 2023 QUARTERLY i following the close of each
taxable quarter,
TAXPAYER TYPE/S SINGLE PROPRIETORSHIP ONLY (RESIDENT CITIZEN)
BUSINESS INFORMATION DETAILS |
CATEGORY REGISTRATION DATE |
TRADE NAME 1 MCRC TAX AND ACCOUNTING SERVICES February 3, 2022
(PSIC) 69200-ACCOUNTING, BOOKKEEPING !
AND AUDITING ACTIVITIES: TAX
CONSULTANCY Prima |
Line of Business | ACCOUNTING, BOOKKEPING AND i |
AUDITING ACTIVITIES: TAX
CONSULTANCY !
REMINDERS:
1. An annual registration fee shall be paid upon registration and every year thereafter on or before the last day
of January, using BIR Form No. 0605.
5. For Self-Employed Individuals (SEI) whose gross sales and/or receipts and other non-operating income
does not exceed P3,000,000 and who opted to avail of the 8% Income tax rate. the tax type Percentage Tax
(PT) shall not be reflected in the Certificate of Registration (COR). However, at the start of each taxable
year, such SEI shall be automatically subjected to graduated income tax rates and required to file quarter
Page 1 of 2
`;

describe("parseCorText — real OCR, Nichievan Variety Store", () => {
  const r = parseCorText(NICHIEVAN);

  it("reads the TIN and branch code", () => {
    expect(r.tin).toBe("494097354");
    expect(r.branch).toBe("00000");
  });

  it("reads the RDO from the OCN (seal destroyed the header line)", () => {
    expect(r.rdo).toBe("046");
  });

  it("splits the individual name into first + middle", () => {
    expect(r.kind).toBe("individual");
    expect(r.lastName).toBe("GREGORIO");
    expect(r.firstName).toBe("NICOLE");
    expect(r.middleName).toBe("REYES");
  });

  it("reads the address, trims trailing OCR junk, extracts ZIP", () => {
    expect(r.address).toContain("PASCO ST");
    expect(r.address?.endsWith("PHILIPPINES")).toBe(true);
    expect(r.zip).toBe("1900");
  });

  it("anchors the trade name on TRADE NAME 1 and strips the glued date", () => {
    expect(r.tradeName).toBe("NICHIEVAN VARIETY STORE");
  });

  it("extracts all three tax-type rows despite wrapped/mangled cells", () => {
    const keys = r.taxTypes.map((t) => `${t.type}|${t.form}|${t.frequency}`);
    expect(keys).toContain("Income Tax|1701|Annually"); // form cell unreadable → inferred from Annually
    expect(keys).toContain("Income Tax|1701Q|Quarterly"); // "INDIVIDUEL" still anchors
    expect(keys).toContain("Percentage Tax|2551Q|Quarterly"); // "NTAGE TAX", form "ssa" → inferred
    expect(r.taxTypes.length).toBe(3);
  });

  it("does not invent rows from the REMINDERS prose (0605 / 2551Q mentions)", () => {
    expect(r.taxTypes.some((t) => t.type === "Registration Fee")).toBe(false);
  });
});

describe("parseCorText — real OCR, MCRC Tax and Accounting Services", () => {
  const r = parseCorText(MCRC);

  it("reads TIN, branch and RDO (via OCN)", () => {
    expect(r.tin).toBe("474079835");
    expect(r.branch).toBe("00000");
    expect(r.rdo).toBe("045");
  });

  it("splits the individual name into first + middle", () => {
    expect(r.kind).toBe("individual");
    expect(r.lastName).toBe("CANLUBO");
    expect(r.firstName).toBe("CHRISTIAN");
    expect(r.middleName).toBe("RIGOR");
  });

  it("reads the trade name without the glued registration date", () => {
    expect(r.tradeName).toBe("MCRC TAX AND ACCOUNTING SERVICES");
  });

  it("extracts all four tax-type rows", () => {
    const keys = r.taxTypes.map((t) => `${t.type}|${t.form}|${t.frequency}`);
    expect(keys).toContain("Income Tax|1701|Annually"); // "NCOME BAA 7" → anchored + inferred
    expect(keys).toContain("Income Tax|1701Q|Quarterly");
    expect(keys).toContain("Registration Fee|0605|");
    expect(keys).toContain("Value-Added Tax|2550Q|Quarterly");
    expect(r.taxTypes.length).toBe(4);
  });

  it("reads filing start dates when legible (even 'March7,2022')", () => {
    const rf = r.taxTypes.find((t) => t.form === "0605");
    const vat = r.taxTypes.find((t) => t.form === "2550Q");
    expect(rf?.startDate).toBe("2022-03-07");
    expect(vat?.startDate).toBe("2023-06-13");
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
    const annual = r.taxTypes.find((t) => t.form === "1701");
    expect(annual?.startDate).toBe("2023-01-01");
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
      "BUSINESS INFORMATION DETAILS\nTRADE NAME 1 PRIMARY CARE PHARMACY February 7, 2024",
    );
    expect(r.tradeName).toBe("PRIMARY CARE PHARMACY");
    const glued = parseCorText("BUSINESS INFORMATION DETAILS\nTRADE NAME 1 NICHIE STORE Primary February 7, 2024");
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

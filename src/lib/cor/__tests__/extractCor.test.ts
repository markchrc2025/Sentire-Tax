// Parser tests for the COR OCR extractor. The OCR engine itself isn't tested
// here (it runs in the browser); these lock down parseCorText against realistic
// Tesseract output — including the column-linearised header row and the
// REMINDERS prose that could otherwise produce phantom tax-type rows.

import { describe, expect, it } from "vitest";
import { parseCorText } from "../parseCor";

// Approximates Tesseract output for the sample COR (BIR Form 2303).
const SAMPLE = `
BIR FORM 2303
REPUBLIKA NG PILIPINAS
KAWANIHAN NG RENTAS INTERNAS
REVENUE REGION NO. 07B - EAST NCR
REVENUE DISTRICT OFFICE NO. 045 - MARIKINA
OCN: 045RC20230000007782
CERTIFICATE OF REGISTRATION
TIN & BRANCH CODE   NAME OF TAXPAYER   TIN ISSUANCE DATE
474-079-835-00000   CANLUBO, CHRISTIAN RIGOR   August 25, 2015
REGISTERING OFFICE   X Head Office   Branch
REGISTERED ADDRESS
#80 DRAGON ST. SAN ROQUE 1801 CITY OF MARIKINA NCR, SECOND DISTRICT PHILIPPINES
TAX TYPES   FORM TYPES   FILING START DATE   FILING FREQUENCY   FILING DUE DATE
INDIVIDUAL INCOME TAX   1701/1701A   January 1, 2023   ANNUALLY
On or before April 15 of each year covering income for the preceding taxable year.
INDIVIDUAL INCOME TAX   1701Q   February 3, 2022   QUARTERLY
1st Quarter on or before MAY 15
REGISTRATION FEE   0605   March 7, 2022
On or before the last day of January.
VALUE ADDED TAX   2550Q   June 13, 2023   QUARTERLY
Not later than the 25th day following the close of each taxable quarter.
TAXPAYER TYPE/S   SINGLE PROPRIETORSHIP ONLY (RESIDENT CITIZEN)
BUSINESS INFORMATION DETAILS
TRADE NAME 1 (PSIC)   MCRC TAX AND ACCOUNTING SERVICES
Line of Business   ACCOUNTING, BOOKKEEPING AND AUDITING ACTIVITIES: TAX CONSULTANCY
REMINDERS:
For Self-Employed Individuals whose gross sales do not exceed P3,000,000 and who
opted to avail of the 8% Income tax rate, the Percentage Tax shall not be reflected.
Such SEI shall be required to file quarterly income tax return (BIR Form No. 2551Q)
and option to replace the COR. QUARTERLY.
`;

describe("parseCorText", () => {
  const r = parseCorText(SAMPLE);

  it("reads the TIN and branch code", () => {
    expect(r.tin).toBe("474079835");
    expect(r.branch).toBe("00000");
  });

  it("reads the RDO code", () => {
    expect(r.rdo).toBe("045");
  });

  it("splits an individual name from the column row (not the TIN/date)", () => {
    expect(r.kind).toBe("individual");
    expect(r.lastName).toBe("CANLUBO");
    expect(r.firstName).toBe("CHRISTIAN RIGOR");
  });

  it("reads the registered address and ZIP", () => {
    expect(r.address).toContain("DRAGON ST");
    expect(r.zip).toBe("1801");
  });

  it("reads the trade name without the (PSIC) noise", () => {
    expect(r.tradeName).toBe("MCRC TAX AND ACCOUNTING SERVICES");
  });

  it("extracts the real tax-type rows", () => {
    const keys = r.taxTypes.map((t) => `${t.type}|${t.form}`);
    expect(keys).toContain("Income Tax|1701");
    expect(keys).toContain("Income Tax|1701Q");
    expect(keys).toContain("Registration Fee|0605");
    expect(keys).toContain("Value-Added Tax|2550Q");
  });

  it("maps filing frequency", () => {
    const vat = r.taxTypes.find((t) => t.form === "2550Q");
    expect(vat?.frequency).toBe("Quarterly");
  });

  it("does not invent tax types from the REMINDERS prose", () => {
    // The reminders mention 2551Q + 'quarterly income tax' — must be excluded.
    expect(r.taxTypes.some((t) => t.form === "2551Q")).toBe(false);
    expect(r.taxTypes.length).toBe(4);
  });

  it("detects a company name as non-individual", () => {
    const c = parseCorText("NAME OF TAXPAYER\n123-456-789-00000 AURORA DIGITAL SOLUTIONS INC. June 1, 2020");
    expect(c.kind).toBe("non-individual");
    expect(c.regName).toContain("AURORA DIGITAL SOLUTIONS INC.");
  });
});

// Core domain types for the Sentire BIR Form Generator.
// Per-form computation *result* types live alongside their compute module
// (src/lib/compute/*) and are re-exported from src/lib/compute.

/** The nine BIR forms supported by the app. */
export type FormCode =
  | "1701"
  | "1701A"
  | "1701Q"
  | "1702RT"
  | "1702Q"
  | "2550Q"
  | "2551Q"
  | "2307"
  | "2316";

export type TaxpayerKind = "individual" | "non-individual";

export type FormCategory = "Income Tax" | "Business Tax" | "Withholding";

/**
 * A single registered tax type line from the BIR Certificate of Registration
 * (BIR Form 2303) — the "Tax Types" table. Each row pairs a tax type with the
 * return it's filed on, its filing frequency and the registration start date.
 */
export interface TaxType {
  /** Tax type, e.g. "Income Tax", "Value-Added Tax", "Registration Fee". */
  type: string;
  /** Form/return type filed for it, e.g. "1701", "2550Q", "0605". */
  form: string;
  /** Filing frequency, e.g. "Annually", "Quarterly", "Monthly". */
  frequency: string;
  /** Filing start date, ISO yyyy-mm-dd (optional). */
  startDate?: string;
}

/** A registered filer — an individual or a company. */
export interface Taxpayer {
  id: string;
  kind: TaxpayerKind;
  regName: string;
  lastName: string;
  firstName: string;
  middleName: string;
  /** Registered trade/business name from the COR ("Trade Name"), if any. */
  tradeName?: string;
  tin: string;
  branch: string;
  rdo: string;
  /** Tax types the filer is registered for, from the COR "Tax Types" table. */
  taxTypes?: TaxType[];
  address: string;
  city: string;
  zip: string;
  /** Date of Birth (individuals), ISO yyyy-mm-dd. */
  birthdate: string;
  /** Date of Incorporation (companies), ISO yyyy-mm-dd. */
  incorpDate?: string;
  email: string;
  phone: string;
  citizenship: string;
  civilStatus: string;
  taxpayerType: string;
  classification: string;
  rdoName?: string;
  /** Storage object path of the uploaded BIR Certificate of Registration (cloud mode). */
  corPath?: string;
  createdAt: number;
  updatedAt?: number;
}

// ---- per-form repeating rows (2307, 2551Q) ----
// The index signature lets a single row object be passed straight to the
// field atoms (which expect a string-keyed `data`).
export interface Row2307 {
  [key: string]: string | undefined;
  atc?: string;
  desc?: string;
  m1?: string;
  m2?: string;
  m3?: string;
  tax?: string;
}

export interface Row2551Q {
  [key: string]: string | undefined;
  atc?: string;
  desc?: string;
  taxable?: string;
  rate?: string;
}

export type FilingRow = Row2307 | Row2551Q;

/**
 * Raw field values for a filing, keyed by form-field id (e.g. "i36A",
 * "salesA", "year"). Values are the literal strings the user typed; computed
 * values are NEVER stored — always derived via `computeFor`. The repeating-line
 * tables used by 2307/2551Q live under the "rows" key (read with a cast to the
 * relevant Row type).
 */
export interface FilingData {
  [key: string]: string | FilingRow[] | undefined;
}

/** A saved eBIRForms XML export, kept on the filing for reference. */
export interface XmlExport {
  at: number;
  filename: string;
  xml: string;
}

export type FilingStatus = "draft" | "filed";

/** A single saved form instance for a taxpayer + period. */
export interface Filing {
  id: string;
  form: FormCode;
  taxpayerId: string;
  status: FilingStatus;
  period: string;
  data: FilingData;
  exports?: XmlExport[];
  createdAt: number;
  updatedAt: number;
}

/** Persisted database shape (single localStorage key). */
export interface BirDatabase {
  taxpayers: Record<string, Taxpayer>;
  filings: Record<string, Filing>;
  seq: number;
  _seeded?: boolean;
}

/** An entry in the form catalog shown in the "New Form" picker. */
export interface CatalogEntry {
  code: FormCode;
  name: string;
  sub: string;
  cat: FormCategory;
  ready: boolean;
}

// repository/types.ts — storage abstraction. Two implementations satisfy it:
// LocalStorageRepository (default) and SupabaseRepository (cloud). The CRUD
// surface is synchronous (the UI reads during render); cloud writes are
// debounced write-through against an in-memory cache hydrated on login.

import type { Filing, FormCode, Taxpayer, XmlExport } from "../../types";

export interface TaxpayerRepository {
  all(): Taxpayer[];
  get(id: string): Taxpayer | null;
  /** Insert or update; assigns id/createdAt/updatedAt as needed. Returns the saved record. */
  save(tp: Taxpayer): Taxpayer;
  /** Remove the taxpayer and cascade-delete its filings. */
  remove(id: string): void;
}

export interface FilingRepository {
  all(): Filing[];
  forTaxpayer(taxpayerId: string): Filing[];
  get(id: string): Filing | null;
  create(form: FormCode, taxpayerId: string): Filing;
  save(filing: Filing): Filing;
  remove(id: string): void;
  /** Record a generated eBIRForms XML export against a filing. */
  addExport(filingId: string, record: XmlExport): void;
}

export interface Repository {
  taxpayers: TaxpayerRepository;
  filings: FilingRepository;
  /** Load persisted data into the in-memory cache. Instant for localStorage. */
  hydrate(): Promise<void>;
  /** Wipe all data (used by dev tooling). */
  resetAll(): void;

  // ---- file attachments (BIR Certificate of Registration) ----
  /** Whether this store supports COR file attachments (cloud only). */
  readonly supportsFiles: boolean;
  /** Upload/replace a taxpayer's COR file and persist its path. */
  uploadCor(taxpayerId: string, file: File): Promise<void>;
  /** A temporary signed URL to view/download the COR, or null if none. */
  corUrl(taxpayerId: string): Promise<string | null>;
  /** Remove a taxpayer's COR file. */
  removeCor(taxpayerId: string): Promise<void>;
}

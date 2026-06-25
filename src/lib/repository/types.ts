// repository/types.ts — storage abstraction. The localStorage implementation
// is the default; this interface lets a backend be swapped in later.

import type { Filing, FormCode, Taxpayer } from "../../types";

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
}

export interface Repository {
  taxpayers: TaxpayerRepository;
  filings: FilingRepository;
  /** Wipe all data (used by dev tooling). */
  resetAll(): void;
}

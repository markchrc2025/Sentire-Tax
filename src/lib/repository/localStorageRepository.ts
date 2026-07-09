// localStorageRepository.ts — typed repository backed by a single localStorage
// key (`sentire_bir_v2`), seeded with sample data on first run.
// Ported from the store + seed logic in bir-data.jsx.

import type { BirDatabase, Filing, FormCode } from "../../types";
import type { FilingRepository, Repository, TaxpayerRepository } from "./types";

const LS_KEY = "sentire_bir_v2";

function blank(): BirDatabase {
  return { taxpayers: {}, filings: {}, seq: 1 };
}

export class LocalStorageRepository implements Repository {
  private db: BirDatabase;

  constructor() {
    // Starts empty on first run — no demo/seed data.
    this.db = this.read() || blank();
    // One-time cleanup: drop demo records a pre-1.0 build may have seeded
    // into this browser's storage.
    if (this.db._seeded) {
      delete this.db.taxpayers["tp_seed_aurora"];
      delete this.db.taxpayers["tp_seed_delacruz"];
      Object.values(this.db.filings).forEach((f) => {
        if (f.taxpayerId === "tp_seed_aurora" || f.taxpayerId === "tp_seed_delacruz") {
          delete this.db.filings[f.id];
        }
      });
      delete this.db._seeded;
      this.persist();
    }
  }

  private read(): BirDatabase | null {
    try {
      if (typeof localStorage === "undefined") return null;
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw) as BirDatabase;
    } catch {
      /* ignore */
    }
    return null;
  }

  private persist(): void {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(LS_KEY, JSON.stringify(this.db));
    } catch {
      /* ignore */
    }
  }

  private uid(prefix: string): string {
    const n = this.db.seq++;
    this.persist();
    return prefix + "_" + Date.now().toString(36) + "_" + n;
  }

  taxpayers: TaxpayerRepository = {
    all: () =>
      Object.values(this.db.taxpayers).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    get: (id) => this.db.taxpayers[id] || null,
    save: (tp) => {
      if (!tp.id) tp.id = this.uid("tp");
      if (!tp.createdAt) tp.createdAt = Date.now();
      tp.updatedAt = Date.now();
      this.db.taxpayers[tp.id] = tp;
      this.persist();
      return tp;
    },
    remove: (id) => {
      delete this.db.taxpayers[id];
      Object.values(this.db.filings).forEach((f) => {
        if (f.taxpayerId === id) delete this.db.filings[f.id];
      });
      this.persist();
    },
  };

  filings: FilingRepository = {
    all: () =>
      Object.values(this.db.filings).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
    forTaxpayer: (taxpayerId) => this.filings.all().filter((f) => f.taxpayerId === taxpayerId),
    get: (id) => this.db.filings[id] || null,
    create: (form: FormCode, taxpayerId: string) => {
      const now = Date.now();
      const f: Filing = {
        id: this.uid("flg"),
        form,
        taxpayerId,
        status: "draft",
        period: "",
        data: {},
        createdAt: now,
        updatedAt: now,
      };
      this.db.filings[f.id] = f;
      this.persist();
      return f;
    },
    save: (f) => {
      f.updatedAt = Date.now();
      this.db.filings[f.id] = f;
      this.persist();
      return f;
    },
    remove: (id) => {
      delete this.db.filings[id];
      this.persist();
    },
    addExport: (filingId, record) => {
      const f = this.db.filings[filingId];
      if (!f) return;
      f.exports = [record, ...(f.exports || [])].slice(0, 12);
      f.updatedAt = Date.now();
      this.persist();
    },
  };

  // localStorage already loads synchronously in the constructor.
  hydrate(): Promise<void> {
    return Promise.resolve();
  }

  // Writes are synchronous and already persisted — nothing to flush.
  flush(): Promise<void> {
    return Promise.resolve();
  }

  // File attachments require object storage — unsupported in local mode.
  readonly supportsFiles = false;
  async uploadCor(): Promise<void> {
    throw new Error("File attachments require the cloud store. Configure Supabase to attach a COR.");
  }
  async corUrl(): Promise<string | null> {
    return null;
  }
  async removeCor(): Promise<void> {
    /* no-op */
  }

  resetAll(): void {
    this.db = blank();
    this.persist();
  }
}

let singleton: Repository | null = null;

/** Shared repository instance for the running app. */
export function getRepository(): Repository {
  if (!singleton) singleton = new LocalStorageRepository();
  return singleton;
}

// localStorageRepository.ts — typed repository backed by a single localStorage
// key (`sentire_bir_v2`), seeded with sample data on first run.
// Ported from the store + seed logic in bir-data.jsx.

import type { BirDatabase, Filing, FormCode } from "../../types";
import type { FilingRepository, Repository, TaxpayerRepository } from "./types";

const LS_KEY = "sentire_bir_v2";

function blank(): BirDatabase {
  return { taxpayers: {}, filings: {}, seq: 1 };
}

function seed(): BirDatabase {
  const db = blank();
  const now = Date.now();
  const t1 = "tp_seed_aurora";
  const t2 = "tp_seed_delacruz";
  db.taxpayers[t1] = {
    id: t1,
    kind: "non-individual",
    regName: "AURORA DIGITAL SOLUTIONS INC.",
    lastName: "",
    firstName: "",
    middleName: "",
    tradeName: "AURORA DIGITAL",
    tin: "284-551-907",
    branch: "00000",
    rdo: "050",
    taxTypes: [
      { type: "Income Tax", form: "1702RT", frequency: "Annually", startDate: "2021-01-01" },
      { type: "Income Tax", form: "1702Q", frequency: "Quarterly", startDate: "2021-01-01" },
      { type: "Value-Added Tax", form: "2550Q", frequency: "Quarterly", startDate: "2021-01-01" },
      { type: "Registration Fee", form: "0605", frequency: "Annually", startDate: "2021-01-01" },
    ],
    address: "Unit 12F, Cyberscape Beta, Topaz Road, Ortigas Center",
    city: "Pasig City",
    zip: "1605",
    birthdate: "",
    email: "tax@auroradigital.ph",
    phone: "02-8845-1190",
    citizenship: "Filipino",
    civilStatus: "",
    taxpayerType: "",
    rdoName: "RDO 050 - Pasig City",
    classification: "Small",
    createdAt: now,
  };
  db.taxpayers[t2] = {
    id: t2,
    kind: "individual",
    regName: "",
    lastName: "DELA CRUZ",
    firstName: "MARIA ISABEL",
    middleName: "SANTOS",
    tin: "192-845-663",
    branch: "00000",
    rdo: "039",
    taxTypes: [
      { type: "Income Tax", form: "1701", frequency: "Annually", startDate: "2019-03-01" },
      { type: "Income Tax", form: "1701Q", frequency: "Quarterly", startDate: "2019-03-01" },
      { type: "Percentage Tax", form: "2551Q", frequency: "Quarterly", startDate: "2019-03-01" },
    ],
    address: "27 Magnolia Street, Barangay Sikatuna Village, Quezon City",
    city: "Quezon City",
    zip: "1101",
    birthdate: "1989-04-12",
    email: "maria.delacruz@gmail.com",
    phone: "0917-555-2841",
    citizenship: "Filipino",
    civilStatus: "Married",
    taxpayerType: "Professional",
    classification: "Micro",
    createdAt: now,
  };
  db.seq = 5;
  db._seeded = true;
  return db;
}

export class LocalStorageRepository implements Repository {
  private db: BirDatabase;

  constructor() {
    this.db = this.read() || seed();
    // Persist seed on first run so ids are stable across reloads.
    if (this.db._seeded && !this.read()) this.persist();
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

export { seed as seedDatabase };

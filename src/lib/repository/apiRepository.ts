// apiRepository.ts — Repository backed by the Sliplane-native Sentire BIR API
// (server/). Same architecture as SupabaseRepository: the UI reads
// synchronously from an in-memory cache hydrated once after sign-in; writes
// update the cache immediately and write through to the API (filing edits are
// debounced). Write failures surface via setErrorListener.

import type { Filing, FormCode, Taxpayer, XmlExport } from "../../types";
import type { FilingRepository, Repository, TaxpayerRepository } from "./types";
import { apiFetch } from "../api/client";

const FILING_SAVE_DEBOUNCE_MS = 600;
const EXPORTS_CAP = 12;
const COR_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const COR_ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

function uid(): string {
  return crypto.randomUUID();
}

export class ApiRepository implements Repository {
  readonly supportsFiles = true;
  private taxpayersMap: Record<string, Taxpayer> = {};
  private filingsMap: Record<string, Filing> = {};
  private filingTimers: Record<string, ReturnType<typeof setTimeout>> = {};
  /** Last in-flight PUT per taxpayer — COR calls await it so a brand-new
   *  taxpayer's file upload can't outrun the row insert (the server would
   *  reject it with "Not your taxpayer"). */
  private taxpayerPuts: Record<string, Promise<void>> = {};
  private errorCb?: (message: string) => void;

  /** Subscribe to background write failures so they can be surfaced in the UI. */
  setErrorListener(cb: (message: string) => void): void {
    this.errorCb = cb;
  }

  private report(context: string, error: unknown): void {
    if (!error) return;
    console.error("[api] " + context, error);
    this.errorCb?.("Couldn't sync your latest change — check your connection. It may not be saved.");
  }

  async hydrate(): Promise<void> {
    const res = await apiFetch("/api/bootstrap");
    const body = (await res.json()) as { taxpayers: Taxpayer[]; filings: Filing[] };
    this.taxpayersMap = {};
    for (const tp of body.taxpayers ?? []) this.taxpayersMap[tp.id] = tp;
    this.filingsMap = {};
    for (const f of body.filings ?? []) this.filingsMap[f.id] = f;
  }

  /** Immediately write any pending (debounced) filing edits. */
  async flush(): Promise<void> {
    const ids = Object.keys(this.filingTimers);
    await Promise.all(
      ids.map((id) => {
        clearTimeout(this.filingTimers[id]);
        delete this.filingTimers[id];
        const f = this.filingsMap[id];
        if (!f) return Promise.resolve();
        return this.putFiling(f).catch((e) => this.report("save filing", e));
      }),
    );
  }

  private async putTaxpayer(tp: Taxpayer): Promise<void> {
    await apiFetch(`/api/taxpayers/${tp.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tp),
    });
  }

  private async putFiling(f: Filing): Promise<void> {
    await apiFetch(`/api/filings/${f.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        form: f.form,
        taxpayerId: f.taxpayerId,
        status: f.status,
        period: f.period ?? "",
        data: f.data ?? {},
      }),
    });
  }

  taxpayers: TaxpayerRepository = {
    all: () =>
      Object.values(this.taxpayersMap).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    get: (id) => this.taxpayersMap[id] || null,
    save: (tp) => {
      if (!tp.id) tp.id = uid();
      if (!tp.createdAt) tp.createdAt = Date.now();
      tp.updatedAt = Date.now();
      this.taxpayersMap[tp.id] = tp;
      const put = this.putTaxpayer(tp);
      // Remember the in-flight write (errors surface here; awaiters just
      // need ordering, not the failure).
      this.taxpayerPuts[tp.id] = put.catch(() => {});
      put.catch((e) => this.report("save taxpayer", e));
      return tp;
    },
    remove: (id) => {
      delete this.taxpayersMap[id];
      for (const f of Object.values(this.filingsMap)) {
        if (f.taxpayerId === id) delete this.filingsMap[f.id];
      }
      const pending = this.taxpayerPuts[id] ?? Promise.resolve();
      pending
        .then(() => apiFetch(`/api/taxpayers/${id}`, { method: "DELETE" }))
        .catch((e) => this.report("remove taxpayer", e));
    },
  };

  filings: FilingRepository = {
    all: () =>
      Object.values(this.filingsMap).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
    forTaxpayer: (taxpayerId) => this.filings.all().filter((f) => f.taxpayerId === taxpayerId),
    get: (id) => this.filingsMap[id] || null,
    create: (form: FormCode, taxpayerId: string) => {
      const now = Date.now();
      const f: Filing = {
        id: uid(),
        form,
        taxpayerId,
        status: "draft",
        period: "",
        data: {},
        exports: [],
        createdAt: now,
        updatedAt: now,
      };
      this.filingsMap[f.id] = f;
      this.putFiling(f).catch((e) => this.report("create filing", e));
      return f;
    },
    save: (f) => {
      f.updatedAt = Date.now();
      this.filingsMap[f.id] = f;
      if (this.filingTimers[f.id]) clearTimeout(this.filingTimers[f.id]);
      this.filingTimers[f.id] = setTimeout(() => {
        delete this.filingTimers[f.id];
        this.putFiling(f).catch((e) => this.report("save filing", e));
      }, FILING_SAVE_DEBOUNCE_MS);
      return f;
    },
    remove: (id) => {
      delete this.filingsMap[id];
      if (this.filingTimers[id]) {
        clearTimeout(this.filingTimers[id]);
        delete this.filingTimers[id];
      }
      apiFetch(`/api/filings/${id}`, { method: "DELETE" }).catch((e) =>
        this.report("remove filing", e),
      );
    },
    addExport: (filingId, record: XmlExport) => {
      const f = this.filingsMap[filingId];
      if (!f) return;
      f.exports = [record, ...(f.exports || [])].slice(0, EXPORTS_CAP);
      apiFetch(`/api/filings/${filingId}/exports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: record.filename, xml: record.xml }),
      }).catch((e) => this.report("add export", e));
    },
  };

  // ---------- COR file attachments ----------

  async uploadCor(taxpayerId: string, file: File): Promise<void> {
    if (file.size > COR_MAX_BYTES) {
      throw new Error("File is too large — the maximum COR size is 10 MB.");
    }
    if (!COR_ALLOWED_TYPES.includes(file.type)) {
      throw new Error("Unsupported file type. Please upload a PDF, PNG, JPEG, or WebP.");
    }
    // A just-created taxpayer's insert may still be in flight — wait for it,
    // or the server rejects the upload before the row exists.
    await this.taxpayerPuts[taxpayerId];
    const res = await apiFetch(`/api/taxpayers/${taxpayerId}/cor`, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const body = (await res.json()) as { corPath?: string };
    const tp = this.taxpayersMap[taxpayerId];
    if (tp && body.corPath) tp.corPath = body.corPath;
  }

  async corUrl(taxpayerId: string): Promise<string | null> {
    try {
      const res = await apiFetch(`/api/taxpayers/${taxpayerId}/cor-url`);
      const body = (await res.json()) as { url?: string | null };
      return body.url ?? null;
    } catch (e) {
      this.report("cor url", e);
      return null;
    }
  }

  async removeCor(taxpayerId: string): Promise<void> {
    await this.taxpayerPuts[taxpayerId];
    await apiFetch(`/api/taxpayers/${taxpayerId}/cor`, { method: "DELETE" });
    const tp = this.taxpayersMap[taxpayerId];
    if (tp) tp.corPath = undefined;
  }

  resetAll(): void {
    /* Not supported in cloud mode. */
  }
}

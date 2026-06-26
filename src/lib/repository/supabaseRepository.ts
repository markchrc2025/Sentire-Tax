// supabaseRepository.ts — cloud-backed Repository.
//
// The UI reads synchronously during render, so this keeps an in-memory cache
// hydrated once on login and serves reads from it. Writes update the cache
// immediately and write through to Postgres (filing edits are debounced so a
// keystroke doesn't fire a request each time). Row-Level Security scopes every
// row to the signed-in user; `owner_id` is set server-side via `auth.uid()`.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Filing, FilingData, FormCode, Taxpayer, XmlExport } from "../../types";
import type { FilingRepository, Repository, TaxpayerRepository } from "./types";
import { COR_BUCKET } from "../supabase/client";

const FILING_SAVE_DEBOUNCE_MS = 600;

// ---------- row <-> domain mapping ----------
type Row = Record<string, unknown>;

const toMs = (ts: unknown): number => {
  const n = ts ? Date.parse(String(ts)) : NaN;
  return Number.isNaN(n) ? Date.now() : n;
};
const s = (v: unknown): string => (v == null ? "" : String(v));

function rowToTaxpayer(r: Row): Taxpayer {
  return {
    id: s(r.id),
    kind: r.kind === "non-individual" ? "non-individual" : "individual",
    regName: s(r.reg_name),
    lastName: s(r.last_name),
    firstName: s(r.first_name),
    middleName: s(r.middle_name),
    tin: s(r.tin),
    branch: s(r.branch),
    rdo: s(r.rdo),
    address: s(r.address),
    city: s(r.city),
    zip: s(r.zip),
    birthdate: s(r.birthdate),
    incorpDate: s(r.incorp_date),
    email: s(r.email),
    phone: s(r.phone),
    citizenship: s(r.citizenship),
    civilStatus: s(r.civil_status),
    taxpayerType: s(r.taxpayer_type),
    classification: s(r.classification),
    rdoName: s(r.rdo_name),
    corPath: r.cor_path ? String(r.cor_path) : undefined,
    createdAt: toMs(r.created_at),
    updatedAt: toMs(r.updated_at),
  };
}

function taxpayerToRow(tp: Taxpayer, ownerId: string): Row {
  return {
    id: tp.id,
    owner_id: ownerId,
    kind: tp.kind,
    reg_name: tp.regName ?? "",
    last_name: tp.lastName ?? "",
    first_name: tp.firstName ?? "",
    middle_name: tp.middleName ?? "",
    tin: tp.tin ?? "",
    branch: tp.branch ?? "00000",
    rdo: tp.rdo ?? "",
    address: tp.address ?? "",
    city: tp.city ?? "",
    zip: tp.zip ?? "",
    birthdate: tp.birthdate ?? "",
    incorp_date: tp.incorpDate ?? "",
    email: tp.email ?? "",
    phone: tp.phone ?? "",
    citizenship: tp.citizenship ?? "",
    civil_status: tp.civilStatus ?? "",
    taxpayer_type: tp.taxpayerType ?? "",
    classification: tp.classification ?? "",
    rdo_name: tp.rdoName ?? "",
    cor_path: tp.corPath ?? null,
  };
}

function rowToFiling(r: Row, exportRows: Row[]): Filing {
  return {
    id: s(r.id),
    form: s(r.form) as FormCode,
    taxpayerId: s(r.taxpayer_id),
    status: r.status === "filed" ? "filed" : "draft",
    period: s(r.period),
    data: (r.data as FilingData) ?? {},
    exports: exportRows.map((e) => ({
      at: toMs(e.created_at),
      filename: s(e.filename),
      xml: s(e.xml),
    })),
    createdAt: toMs(r.created_at),
    updatedAt: toMs(r.updated_at),
  };
}

function filingToRow(f: Filing, ownerId: string): Row {
  return {
    id: f.id,
    owner_id: ownerId,
    taxpayer_id: f.taxpayerId,
    form: f.form,
    status: f.status,
    period: f.period ?? "",
    data: f.data ?? {},
  };
}

function uid(): string {
  return crypto.randomUUID();
}

export class SupabaseRepository implements Repository {
  readonly supportsFiles = true;
  private taxpayersMap: Record<string, Taxpayer> = {};
  private filingsMap: Record<string, Filing> = {};
  private filingTimers: Record<string, ReturnType<typeof setTimeout>> = {};

  constructor(
    private sb: SupabaseClient,
    private ownerId: string,
  ) {}

  private report(context: string, error: unknown): void {
    if (error) console.error("[supabase] " + context, error);
  }

  async hydrate(): Promise<void> {
    const [tpRes, flRes, exRes] = await Promise.all([
      this.sb.from("taxpayers").select("*"),
      this.sb.from("filings").select("*"),
      this.sb.from("filing_exports").select("*").order("created_at", { ascending: false }),
    ]);
    this.report("hydrate taxpayers", tpRes.error);
    this.report("hydrate filings", flRes.error);
    this.report("hydrate exports", exRes.error);

    const exportsByFiling: Record<string, Row[]> = {};
    for (const e of (exRes.data as Row[]) ?? []) {
      const fid = s(e.filing_id);
      (exportsByFiling[fid] ??= []).push(e);
    }

    this.taxpayersMap = {};
    for (const r of (tpRes.data as Row[]) ?? []) {
      const tp = rowToTaxpayer(r);
      this.taxpayersMap[tp.id] = tp;
    }
    this.filingsMap = {};
    for (const r of (flRes.data as Row[]) ?? []) {
      const f = rowToFiling(r, exportsByFiling[s(r.id)] ?? []);
      this.filingsMap[f.id] = f;
    }
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
      this.sb
        .from("taxpayers")
        .upsert(taxpayerToRow(tp, this.ownerId))
        .then(({ error }) => this.report("save taxpayer", error));
      return tp;
    },
    remove: (id) => {
      delete this.taxpayersMap[id];
      for (const f of Object.values(this.filingsMap)) {
        if (f.taxpayerId === id) delete this.filingsMap[f.id];
      }
      this.sb
        .from("taxpayers")
        .delete()
        .eq("id", id)
        .then(({ error }) => this.report("remove taxpayer", error));
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
      this.sb
        .from("filings")
        .insert(filingToRow(f, this.ownerId))
        .then(({ error }) => this.report("create filing", error));
      return f;
    },
    save: (f) => {
      f.updatedAt = Date.now();
      this.filingsMap[f.id] = f;
      // Debounce the network write so rapid edits collapse into one upsert.
      if (this.filingTimers[f.id]) clearTimeout(this.filingTimers[f.id]);
      this.filingTimers[f.id] = setTimeout(() => {
        delete this.filingTimers[f.id];
        this.sb
          .from("filings")
          .upsert(filingToRow(f, this.ownerId))
          .then(({ error }) => this.report("save filing", error));
      }, FILING_SAVE_DEBOUNCE_MS);
      return f;
    },
    remove: (id) => {
      delete this.filingsMap[id];
      if (this.filingTimers[id]) {
        clearTimeout(this.filingTimers[id]);
        delete this.filingTimers[id];
      }
      this.sb
        .from("filings")
        .delete()
        .eq("id", id)
        .then(({ error }) => this.report("remove filing", error));
    },
    addExport: (filingId, record: XmlExport) => {
      const f = this.filingsMap[filingId];
      if (!f) return;
      f.exports = [record, ...(f.exports || [])].slice(0, 12);
      this.sb
        .from("filing_exports")
        .insert({
          id: uid(),
          owner_id: this.ownerId,
          filing_id: filingId,
          filename: record.filename,
          xml: record.xml,
        })
        .then(({ error }) => this.report("add export", error));
    },
  };

  // ---------- COR file attachments ----------
  private corPathFor(taxpayerId: string): string {
    return `${this.ownerId}/${taxpayerId}`;
  }

  async uploadCor(taxpayerId: string, file: File): Promise<void> {
    const path = this.corPathFor(taxpayerId);
    const { error } = await this.sb.storage
      .from(COR_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type || "application/octet-stream" });
    if (error) throw error;
    const tp = this.taxpayersMap[taxpayerId];
    if (tp) {
      tp.corPath = path;
      this.taxpayers.save(tp);
    }
  }

  async corUrl(taxpayerId: string): Promise<string | null> {
    const tp = this.taxpayersMap[taxpayerId];
    if (!tp?.corPath) return null;
    const { data, error } = await this.sb.storage
      .from(COR_BUCKET)
      .createSignedUrl(tp.corPath, 3600);
    if (error) {
      this.report("cor signed url", error);
      return null;
    }
    return data?.signedUrl ?? null;
  }

  async removeCor(taxpayerId: string): Promise<void> {
    const tp = this.taxpayersMap[taxpayerId];
    if (!tp?.corPath) return;
    const { error } = await this.sb.storage.from(COR_BUCKET).remove([tp.corPath]);
    if (error) throw error;
    tp.corPath = undefined;
    this.taxpayers.save(tp);
  }

  resetAll(): void {
    /* Not supported in cloud mode — manage data via the app or Supabase dashboard. */
  }
}

// index.ts — Sentire BIR API: auth + taxpayers/filings/exports + COR files.
//
// The SPA's ApiRepository is the only client. Every /api route is scoped to
// the authenticated user (WHERE owner_id = $user), which replaces Supabase's
// row-level security. Responses are domain-shaped (src/types in the app),
// so the client needs no column mapping.

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { env, portalEnabled } from "./env.js";
import { migrate, ms, pool } from "./db.js";
import { HttpError, requireAuth, signIn, signUp, verify, type AuthUser } from "./auth.js";
import { COR_ALLOWED_TYPES, COR_MAX_BYTES, corKey, corSignedUrl, deleteCor, putCor } from "./storage.js";
import { portal } from "./portal.js";

type Vars = { Variables: { user: AuthUser } };

const app = new Hono<Vars>();

const origins = env.corsOrigin.split(",").map((s) => s.trim()).filter(Boolean);
app.use(
  "*",
  cors({
    origin: origins.includes("*") ? "*" : origins,
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.onError((err, c) => {
  if (err instanceof HttpError) return c.json({ error: err.message }, err.status as 400);
  console.error("[api]", err);
  return c.json({ error: "Something went wrong." }, 500);
});

app.get("/health", (c) => c.json({ ok: true }));

// ---------------------------------------------------------------- auth

app.post("/auth/signup", async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();
  return c.json(await signUp(email, password));
});

app.post("/auth/signin", async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();
  return c.json(await signIn(email, password));
});

app.get("/auth/me", (c) => {
  const header = c.req.header("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const user = token ? verify(token) : null;
  if (!user) return c.json({ error: "Not signed in." }, 401);
  return c.json({ user });
});

// ---------------------------------------------------------------- data

const api = new Hono<Vars>();
api.use("*", requireAuth);

/** Row → domain Taxpayer (the JSONB doc carries all profile fields). */
type Row = Record<string, unknown>;
const toTaxpayer = (r: Row) => ({
  ...(r.data as Record<string, unknown>),
  id: r.id,
  corPath: r.cor_path ?? undefined,
  createdAt: ms(r.created_at),
  updatedAt: ms(r.updated_at),
});

const toFiling = (r: Row, exports: unknown[]) => ({
  id: r.id,
  form: r.form,
  taxpayerId: r.taxpayer_id,
  status: r.status,
  period: r.period,
  data: r.data ?? {},
  exports,
  createdAt: ms(r.created_at),
  updatedAt: ms(r.updated_at),
});

// Everything the app needs to hydrate, in one round trip.
api.get("/bootstrap", async (c) => {
  const uid = c.var.user.id;
  const [tps, fls, exs] = await Promise.all([
    pool.query("select * from taxpayers where owner_id = $1", [uid]),
    pool.query("select * from filings where owner_id = $1", [uid]),
    pool.query(
      "select filing_id, filename, xml, created_at from filing_exports where owner_id = $1 order by created_at desc",
      [uid],
    ),
  ]);
  const exportsByFiling: Record<string, unknown[]> = {};
  for (const e of exs.rows) {
    const list = (exportsByFiling[e.filing_id] ??= []);
    if (list.length < 12) list.push({ at: ms(e.created_at), filename: e.filename, xml: e.xml });
  }
  return c.json({
    user: c.var.user,
    taxpayers: tps.rows.map(toTaxpayer),
    filings: fls.rows.map((r) => toFiling(r, exportsByFiling[String(r.id)] ?? [])),
  });
});

api.put("/taxpayers/:id", async (c) => {
  const uid = c.var.user.id;
  const id = c.req.param("id");
  const body = await c.req.json<Record<string, unknown>>();
  // Server-managed fields never come from the document body.
  const { id: _i, corPath: _c, createdAt: _cr, updatedAt: _u, ...data } = body;
  const r = await pool.query(
    `insert into taxpayers (id, owner_id, data) values ($1, $2, $3)
     on conflict (id) do update set data = excluded.data, updated_at = now()
     where taxpayers.owner_id = excluded.owner_id
     returning *`,
    [id, uid, JSON.stringify(data)],
  );
  if (r.rowCount === 0) throw new HttpError(403, "Not your record.");
  return c.json(toTaxpayer(r.rows[0]));
});

api.delete("/taxpayers/:id", async (c) => {
  const uid = c.var.user.id;
  const id = c.req.param("id");
  const r = await pool.query(
    "delete from taxpayers where id = $1 and owner_id = $2 returning cor_path",
    [id, uid],
  );
  const corPath = r.rows[0]?.cor_path as string | null | undefined;
  if (corPath) await deleteCor(corPath).catch((e) => console.error("[cor] delete", e));
  return c.json({ ok: true });
});

api.put("/filings/:id", async (c) => {
  const uid = c.var.user.id;
  const id = c.req.param("id");
  const b = await c.req.json<{
    form: string;
    taxpayerId: string;
    status?: string;
    period?: string;
    data?: unknown;
  }>();
  const owns = await pool.query("select 1 from taxpayers where id = $1 and owner_id = $2", [
    b.taxpayerId,
    uid,
  ]);
  if (owns.rowCount === 0) throw new HttpError(403, "Not your taxpayer.");
  const r = await pool.query(
    `insert into filings (id, owner_id, taxpayer_id, form, status, period, data)
     values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (id) do update
       set taxpayer_id = excluded.taxpayer_id, form = excluded.form,
           status = excluded.status, period = excluded.period,
           data = excluded.data, updated_at = now()
     where filings.owner_id = excluded.owner_id
     returning *`,
    [id, uid, b.taxpayerId, b.form, b.status ?? "draft", b.period ?? "", JSON.stringify(b.data ?? {})],
  );
  if (r.rowCount === 0) throw new HttpError(403, "Not your record.");
  return c.json(toFiling(r.rows[0], []));
});

api.delete("/filings/:id", async (c) => {
  await pool.query("delete from filings where id = $1 and owner_id = $2", [
    c.req.param("id"),
    c.var.user.id,
  ]);
  return c.json({ ok: true });
});

api.post("/filings/:id/exports", async (c) => {
  const uid = c.var.user.id;
  const filingId = c.req.param("id");
  const { filename, xml } = await c.req.json<{ filename: string; xml: string }>();
  const owns = await pool.query("select 1 from filings where id = $1 and owner_id = $2", [filingId, uid]);
  if (owns.rowCount === 0) throw new HttpError(403, "Not your filing.");
  await pool.query(
    "insert into filing_exports (owner_id, filing_id, filename, xml) values ($1, $2, $3, $4)",
    [uid, filingId, filename ?? "", xml ?? ""],
  );
  // Keep only the latest 12 exports per filing (matches the app's cap).
  await pool.query(
    `delete from filing_exports where filing_id = $1 and id not in (
       select id from filing_exports where filing_id = $1 order by created_at desc limit 12)`,
    [filingId],
  );
  return c.json({ ok: true });
});

// ---------------------------------------------------------------- COR files

api.put("/taxpayers/:id/cor", async (c) => {
  const uid = c.var.user.id;
  const id = c.req.param("id");
  const contentType = c.req.header("content-type") || "";
  if (!COR_ALLOWED_TYPES.includes(contentType)) {
    throw new HttpError(400, "Unsupported file type. Please upload a PDF, PNG, JPEG, or WebP.");
  }
  const owns = await pool.query("select 1 from taxpayers where id = $1 and owner_id = $2", [id, uid]);
  if (owns.rowCount === 0) throw new HttpError(403, "Not your taxpayer.");
  const body = new Uint8Array(await c.req.arrayBuffer());
  if (body.byteLength === 0) throw new HttpError(400, "Empty file.");
  if (body.byteLength > COR_MAX_BYTES) {
    throw new HttpError(400, "File is too large — the maximum COR size is 10 MB.");
  }
  const key = corKey(uid, id);
  await putCor(key, body, contentType);
  await pool.query("update taxpayers set cor_path = $1, updated_at = now() where id = $2", [key, id]);
  return c.json({ corPath: key });
});

api.get("/taxpayers/:id/cor-url", async (c) => {
  const uid = c.var.user.id;
  const r = await pool.query("select cor_path from taxpayers where id = $1 and owner_id = $2", [
    c.req.param("id"),
    uid,
  ]);
  const corPath = r.rows[0]?.cor_path as string | null | undefined;
  if (!corPath) return c.json({ url: null });
  return c.json({ url: await corSignedUrl(corPath) });
});

api.delete("/taxpayers/:id/cor", async (c) => {
  const uid = c.var.user.id;
  const id = c.req.param("id");
  const r = await pool.query("select cor_path from taxpayers where id = $1 and owner_id = $2", [id, uid]);
  const corPath = r.rows[0]?.cor_path as string | null | undefined;
  if (corPath) {
    await deleteCor(corPath);
    await pool.query("update taxpayers set cor_path = null, updated_at = now() where id = $1", [id]);
  }
  return c.json({ ok: true });
});

// -------------------------------------------- Accounting Firm Portal connector
// Server-side broker to the Portal (holds OAuth creds; browser never sees them).
// Every route is behind requireAuth, so only a signed-in practitioner can sync.

api.get("/portal/status", (c) => c.json({ enabled: portalEnabled() }));

api.get("/portal/clients", async (c) => {
  const query = c.req.query("query") || undefined;
  return c.json(await portal.listClients(query));
});

api.get("/portal/clients/:id", async (c) => {
  return c.json(await portal.getClient(c.req.param("id")));
});

api.get("/portal/clients/:id/vat-summary", async (c) => {
  const year = Number(c.req.query("year"));
  const quarter = Number(c.req.query("quarter"));
  if (!year || !quarter) throw new HttpError(400, "year and quarter are required.");
  return c.json(await portal.getVatSummary(c.req.param("id"), year, quarter));
});

api.post("/portal/clients/:id/bir-filings", async (c) => {
  const body = await c.req.json<unknown>();
  return c.json(await portal.pushFiling(c.req.param("id"), body));
});

api.post("/portal/clients/:id/input-tax-asset", async (c) => {
  const body = await c.req.json<unknown>();
  return c.json(await portal.bookInputTaxAsset(c.req.param("id"), body));
});

app.route("/api", api);

// ---------------------------------------------------------------- boot

await migrate();
serve({ fetch: app.fetch, port: env.port }, (info) => {
  console.log(`[api] listening on :${info.port}`);
});

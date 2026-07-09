// db.ts — Postgres pool + idempotent schema migration, applied at boot.
//
// Storage model: the domain objects (Taxpayer, Filing) are kept as JSONB
// `data` documents plus the few columns the server itself needs for scoping,
// foreign keys and ordering. The API always filters by owner_id, which
// replaces Supabase's row-level security.

import pg from "pg";
import { env } from "./env.js";

export const pool = new pg.Pool({ connectionString: env.databaseUrl, max: 10 });

const DDL = `
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  password_hash text not null,
  created_at    timestamptz not null default now()
);
create unique index if not exists users_email_idx on users (lower(email));

create table if not exists taxpayers (
  id         uuid primary key,
  owner_id   uuid not null references users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  cor_path   text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists taxpayers_owner_idx on taxpayers(owner_id);

create table if not exists filings (
  id          uuid primary key,
  owner_id    uuid not null references users(id) on delete cascade,
  taxpayer_id uuid not null references taxpayers(id) on delete cascade,
  form        text not null,
  status      text not null default 'draft',
  period      text not null default '',
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists filings_owner_idx on filings(owner_id);
create index if not exists filings_taxpayer_idx on filings(taxpayer_id);

create table if not exists filing_exports (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references users(id) on delete cascade,
  filing_id  uuid not null references filings(id) on delete cascade,
  filename   text not null default '',
  xml        text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists filing_exports_filing_idx on filing_exports(filing_id);
`;

export async function migrate(): Promise<void> {
  await pool.query(DDL);
  console.log("[db] schema ready");
}

export const ms = (ts: unknown): number => {
  const n = ts ? Date.parse(String(ts)) : NaN;
  return Number.isNaN(n) ? Date.now() : n;
};

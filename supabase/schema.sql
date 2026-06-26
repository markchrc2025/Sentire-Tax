-- Sentire BIR Form Generator — Supabase backend schema
-- =====================================================
-- Run this ONCE in a fresh project's SQL Editor (Dashboard → SQL Editor → New query).
-- It is re-runnable (idempotent): tables use IF NOT EXISTS and policies are dropped
-- before being recreated. It builds the three tables, their Row-Level Security
-- (every row scoped to owner_id = auth.uid()), an updated_at trigger, and the
-- private `cor` storage bucket for BIR Certificate of Registration uploads.
--
-- Auth: enable Email provider (Dashboard → Authentication → Providers → Email).
-- The app never sends owner_id — the column DEFAULT auth.uid() fills it and RLS
-- enforces it.

-- ========================= Tables =========================

create table if not exists public.taxpayers (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind          text not null default 'individual',   -- 'individual' | 'non-individual'
  reg_name      text not null default '',
  last_name     text not null default '',
  first_name    text not null default '',
  middle_name   text not null default '',
  tin           text not null default '',              -- plain 9 digits
  branch        text not null default '00000',         -- 5-digit branch code
  rdo           text not null default '',
  address       text not null default '',
  city          text not null default '',
  zip           text not null default '',
  birthdate     text not null default '',              -- ISO yyyy-mm-dd (individuals)
  incorp_date   text not null default '',              -- ISO yyyy-mm-dd (companies)
  email         text not null default '',
  phone         text not null default '',
  citizenship   text not null default '',
  civil_status  text not null default '',
  taxpayer_type text not null default '',
  classification text not null default '',
  rdo_name      text not null default '',
  cor_path      text,                                  -- storage object path, or null
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.filings (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  taxpayer_id uuid not null references public.taxpayers(id) on delete cascade,
  form        text not null,                           -- e.g. '1701A'
  status      text not null default 'draft',           -- 'draft' | 'filed'
  period      text not null default '',                -- '2024' or '2024-Q1'
  data        jsonb not null default '{}'::jsonb,       -- raw field values (FilingData)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.filing_exports (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  filing_id  uuid not null references public.filings(id) on delete cascade,
  filename   text not null default '',
  xml        text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists taxpayers_owner_idx       on public.taxpayers(owner_id);
create index if not exists filings_owner_idx         on public.filings(owner_id);
create index if not exists filings_taxpayer_idx      on public.filings(taxpayer_id);
create index if not exists filing_exports_owner_idx  on public.filing_exports(owner_id);
create index if not exists filing_exports_filing_idx on public.filing_exports(filing_id);

-- ===================== updated_at trigger =====================
-- The app upserts without sending updated_at, so a trigger bumps it on UPDATE.

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists taxpayers_set_updated_at on public.taxpayers;
create trigger taxpayers_set_updated_at before update on public.taxpayers
  for each row execute function public.set_updated_at();

drop trigger if exists filings_set_updated_at on public.filings;
create trigger filings_set_updated_at before update on public.filings
  for each row execute function public.set_updated_at();

-- ===================== Row-Level Security =====================

alter table public.taxpayers      enable row level security;
alter table public.filings        enable row level security;
alter table public.filing_exports enable row level security;

drop policy if exists "taxpayers_owner_select" on public.taxpayers;
drop policy if exists "taxpayers_owner_insert" on public.taxpayers;
drop policy if exists "taxpayers_owner_update" on public.taxpayers;
drop policy if exists "taxpayers_owner_delete" on public.taxpayers;
create policy "taxpayers_owner_select" on public.taxpayers for select using (owner_id = auth.uid());
create policy "taxpayers_owner_insert" on public.taxpayers for insert with check (owner_id = auth.uid());
create policy "taxpayers_owner_update" on public.taxpayers for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "taxpayers_owner_delete" on public.taxpayers for delete using (owner_id = auth.uid());

drop policy if exists "filings_owner_select" on public.filings;
drop policy if exists "filings_owner_insert" on public.filings;
drop policy if exists "filings_owner_update" on public.filings;
drop policy if exists "filings_owner_delete" on public.filings;
create policy "filings_owner_select" on public.filings for select using (owner_id = auth.uid());
create policy "filings_owner_insert" on public.filings for insert with check (owner_id = auth.uid());
create policy "filings_owner_update" on public.filings for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "filings_owner_delete" on public.filings for delete using (owner_id = auth.uid());

drop policy if exists "filing_exports_owner_select" on public.filing_exports;
drop policy if exists "filing_exports_owner_insert" on public.filing_exports;
drop policy if exists "filing_exports_owner_delete" on public.filing_exports;
create policy "filing_exports_owner_select" on public.filing_exports for select using (owner_id = auth.uid());
create policy "filing_exports_owner_insert" on public.filing_exports for insert with check (owner_id = auth.uid());
create policy "filing_exports_owner_delete" on public.filing_exports for delete using (owner_id = auth.uid());

-- ================= Storage: private 'cor' bucket =================
-- Objects are stored at "<owner_id>/<taxpayer_id>". Each user can only access
-- files inside their own top-level folder. 10 MB limit, PDF/PNG/JPEG/WebP only.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cor', 'cor', false, 10485760,
        array['application/pdf','image/png','image/jpeg','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cor_owner_select" on storage.objects;
drop policy if exists "cor_owner_insert" on storage.objects;
drop policy if exists "cor_owner_update" on storage.objects;
drop policy if exists "cor_owner_delete" on storage.objects;
create policy "cor_owner_select" on storage.objects for select to authenticated
  using (bucket_id = 'cor' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "cor_owner_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'cor' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "cor_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'cor' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "cor_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'cor' and (storage.foldername(name))[1] = auth.uid()::text);

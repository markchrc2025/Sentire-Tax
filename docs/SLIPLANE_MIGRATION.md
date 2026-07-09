# Migrating Sentire BIR Form Generator to Sliplane

**Scope:** move the web app off Vercel onto a Sliplane web service, and move the
data plane (today: Supabase cloud project `hlcdaqvsvjnynypsnstk`) onto
Sliplane-hosted containers.

**Read this first.** The app is a static SPA that talks to **Supabase**, which
is four things at once: Postgres, **Auth** (email + password sessions), the
**REST API** the browser calls (browsers cannot speak the Postgres wire
protocol), and **file Storage** (the private `cor` bucket). A plain Postgres
container on Sliplane therefore **cannot** replace Supabase by itself — the
data-plane migration means self-hosting the Supabase stack (Postgres + GoTrue +
PostgREST + Storage API behind the Kong gateway) on Sliplane. The repo already
abstracts persistence behind `Repository`, and `supabase/schema.sql` is
idempotent, which makes this migration clean.

The migration is two independent phases. **Do Phase 1 first** — it is
low-risk, reversible in minutes, and delivers "off Vercel" immediately while
still using Supabase cloud. Phase 2 (data plane) is the bigger lift.

---

## Phase 0 — Prerequisites

1. A Sliplane account (sign in with GitHub) and a project.
2. GitHub access to `markchrc2025/Sentire-Tax` granted to Sliplane.
3. The current Supabase project's **service_role key**, **anon key**, and
   **database password** (Supabase dashboard → Project Settings → API /
   Database).
4. This repo at `main` — it already contains the container kit:
   - `Dockerfile` (multi-stage: Node build → nginx serve)
   - `deploy/nginx.conf` (SPA fallback — replaces `vercel.json`)
   - `deploy/docker-entrypoint.sh` (renders `/env.js` from runtime env vars)
   - `public/env.js` + `src/lib/supabase/client.ts` runtime-config support

**How config works in the container:** Vite normally bakes `VITE_*` variables
into the bundle at build time. The kit instead renders them into `/env.js` at
**container start**, and the client prefers `window.__ENV` over
`import.meta.env`. Changing an env var in Sliplane and restarting the service
is enough — no rebuild.

---

## Phase 1 — Web service: Vercel → Sliplane

*(~30 minutes; Supabase cloud stays untouched; Vercel keeps running until you
flip DNS/links.)*

1. **Create a server.** Sliplane → *Servers* → *Create Server*. The smallest
   tier comfortably serves a static SPA. Pick an EU region (Hetzner) — or
   whichever is closest to your users.
2. **Create the service.** *Services* → *Deploy Service* → *from GitHub
   repository* → pick `markchrc2025/Sentire-Tax`, branch **`main`**. Sliplane
   detects the `Dockerfile` at the repo root — keep it.
3. **Port & visibility.** Exposed port **80** (nginx). Visibility **public**.
4. **Environment variables** (service settings):
   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://hlcdaqvsvjnynypsnstk.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | the current anon key |
5. **Deploy.** First build takes a few minutes. You get a
   `https://<service>.sliplane.app` URL.
6. **Update Supabase auth allow-list.** Supabase dashboard → Authentication →
   URL Configuration → add the new Sliplane URL to *Site URL / Redirect URLs*
   (login is email+password so this mainly affects password-reset links).
7. **Verify** (checklist below), then treat the Sliplane URL as primary.
   Auto-deploy is on by default: every merge to `main` (your Auto-PR flow)
   redeploys — same behavior you had on Vercel.
8. **Custom domain (optional).** Service → Domains → add domain → create the
   CNAME it shows at your DNS host. TLS is automatic.
9. **Decommission Vercel** only after a week of clean running: Vercel
   dashboard → project → Settings → Delete Project (or just disable
   deployments and keep it as cold standby).

**Rollback:** the Vercel deployment is untouched — go back to its URL.

---

## Phase 2 — Data plane: Supabase cloud → self-hosted Supabase on Sliplane

*(Half a day + a verification window. Read fully before starting.)*

> **Fresh-start shortcut (no data to keep).** If the cloud data is disposable
> test data, Phase 2 collapses to: stand up the stack (§2.1–2.2) → run
> `supabase/schema.sql` (§2.3) → point the web service's two env vars at the
> new stack (§2.5 step 2–3) → **create your account fresh** in the app. Skip
> §2.4 (data migration) entirely. The one thing you CANNOT skip is the stack
> itself: `schema.sql` references `auth.users`, `auth.uid()` and
> `storage.buckets`/`storage.objects`, which only exist after the Supabase
> images (GoTrue, storage-api) have run their own migrations — the script
> fails on a bare `postgres:*` container, and the browser app can only talk
> to the HTTP stack (Kong), never to Postgres directly.

### 2.1 What actually has to run

The app uses exactly these Supabase services (no Realtime, no Edge Functions,
no analytics today):

| Sliplane service | Image | Purpose | Volume | Visibility |
|---|---|---|---|---|
| `sb-db` | `supabase/postgres` (pin the version the compose file references) | Postgres 15 + Supabase roles/extensions | `/var/lib/postgresql/data` | **internal** |
| `sb-auth` | `supabase/gotrue` | email+password auth (`/auth/v1`) | — | internal |
| `sb-rest` | `postgrest/postgrest` | table REST API (`/rest/v1`) | — | internal |
| `sb-storage` | `supabase/storage-api` | `cor` bucket (`/storage/v1`) | `/var/lib/storage` | internal |
| `sb-kong` | Kong with the Supabase declarative config baked in | single public gateway routing `/auth/v1`, `/rest/v1`, `/storage/v1` | — | **public** |
| `sb-studio` + `sb-meta` *(optional)* | `supabase/studio`, `supabase/postgres-meta` | admin UI | — | internal / IP-restricted |

Two ways to stand this up on Sliplane:

- **Option A — compose import (try first).** Sliplane can parse a
  `docker-compose.yml` into services ([docs on running compose setups as
  standalone containers](https://sliplane.io/blog/how-to-run-docker-compose-setups-as-standalone-containers)).
  Download the official Supabase self-hosting compose bundle
  ([supabase.com/docs/guides/self-hosting/docker](https://supabase.com/docs/guides/self-hosting/docker)),
  **delete the services you don't need** (realtime, functions, analytics,
  vector, imgproxy), then import. Review every generated service — the parser
  applies defaults, and files the compose bind-mounts (Kong's `kong.yml`, the
  db init scripts) must still reach the containers (see Option B for the
  pattern if they don't).
- **Option B — service-by-service.** Create the six services above by image.
  The only one that needs a custom build is **Kong**, because Supabase's
  routing lives in a declarative `kong.yml`: make a tiny repo (or a `deploy/`
  subfolder) with `FROM kong:2.8` + `COPY kong.yml /home/kong/kong.yml` and the
  env `KONG_DECLARATIVE_CONFIG=/home/kong/kong.yml`. GoTrue, PostgREST and
  storage-api are configured purely by env vars pointing at
  `sb-db`'s **internal hostname** (Sliplane gives every service one —
  referencable as `$SERVICE_NAME.INTERNAL_HOST`).

### 2.2 Secrets (do this before starting anything)

Follow the [Supabase self-hosting guide](https://supabase.com/docs/guides/self-hosting/docker#securing-your-services):

1. Generate a strong `POSTGRES_PASSWORD` and a 40+ char `JWT_SECRET`.
2. Generate the matching `ANON_KEY` and `SERVICE_ROLE_KEY` JWTs (the guide has
   a generator). **These replace the cloud project's keys everywhere.**
3. GoTrue email settings: Supabase cloud sent signup/reset emails for you —
   self-hosted GoTrue needs an SMTP provider (Resend/SES/Mailgun...) via
   `GOTRUE_SMTP_*`, or set `GOTRUE_MAILER_AUTOCONFIRM=true` to skip
   confirmation emails (password reset then requires admin help — fine for a
   small internal user base, decide explicitly).
4. Set `API_EXTERNAL_URL` / `SITE_URL` to the public Kong URL and the app URL.

### 2.3 Schema

Once `sb-db` + the stack are up (GoTrue and storage-api run their own
migrations on first boot — start order: db → auth/rest/storage → kong):

```bash
# the repo's schema is idempotent: tables, RLS, trigger, cor bucket
psql "postgresql://postgres:<NEW_PW>@<sb-db-host>:5432/postgres" \
  -f supabase/schema.sql
```

### 2.4 Data migration (cloud → Sliplane)

Order matters: **auth users first** (public tables FK-reference
`auth.users(id)`), then public data, then storage files.

```bash
CLOUD="postgresql://postgres:<CLOUD_DB_PW>@db.hlcdaqvsvjnynypsnstk.supabase.co:5432/postgres"
NEW="postgresql://postgres:<NEW_PW>@<sb-db-host>:5432/postgres"

# 1. auth users + identities (bcrypt password hashes survive the move,
#    so users keep their passwords; UUIDs survive, so RLS keeps working)
pg_dump "$CLOUD" --data-only --rows-per-insert=1000 \
  --table=auth.users --table=auth.identities > auth_data.sql

# 2. app tables
pg_dump "$CLOUD" --data-only --rows-per-insert=1000 \
  --schema=public > public_data.sql

# 3. restore (disable triggers/FK checks during the auth import)
psql "$NEW" -c "SET session_replication_role = replica;" \
  --single-transaction -f auth_data.sql
psql "$NEW" --single-transaction -f public_data.sql

# 4. sanity counts on both ends
psql "$CLOUD" -c "SELECT count(*) FROM taxpayers; SELECT count(*) FROM filings;"
psql "$NEW"   -c "SELECT count(*) FROM taxpayers; SELECT count(*) FROM filings;"
```

**Storage files (`cor` bucket).** Object *metadata* is not enough — the bytes
live in Supabase's cloud storage. Copy them with a short script using two
clients (old + new, both with **service_role** keys): list `cor` (paths are
`<owner_uid>/<taxpayer_id>`), download each, upload to the new stack with the
same path and content type. Because the auth UUIDs were preserved, the
owner-scoped storage policies keep working unchanged.

### 2.5 Cutover

1. Announce a short freeze (no edits) — or accept re-running §2.4 as a final
   delta pass.
2. Sliplane web service → env vars:
   - `VITE_SUPABASE_URL` → `https://<sb-kong public URL>` (or your custom
     `api.` domain)
   - `VITE_SUPABASE_ANON_KEY` → the **new** self-host anon key
3. Restart the web service (entrypoint re-renders `/env.js` — no rebuild).
4. Run the verification checklist. **Rollback = set the two env vars back to
   the cloud values and restart.** Nothing else changes.
5. Keep the Supabase cloud project paused-but-alive for 2–4 weeks, then delete.

### 2.6 After cutover

- **Backups:** attach Sliplane volume backups for `sb-db` and `sb-storage`,
  and add a nightly `pg_dump` job (a tiny cron service on the same server)
  shipping dumps off-box. Supabase cloud was doing this for you — now it's
  yours.
- **Upgrades:** you now own GoTrue/PostgREST/storage/Kong versions. Pin image
  tags; upgrade deliberately, never `latest`.
- **The Portal integration (System Design §7)** planned a Supabase **Edge
  Function** (`portal-sync`). Self-hosted, run it as one more Sliplane service
  instead (a ~50-line Node/Hono proxy) — same trust boundary, simpler than
  self-hosting the Supabase functions runtime.

---

## Verification checklist (both phases)

- [ ] Sign in with an existing account (password unchanged) — Phase 2 proves
      the auth migration.
- [ ] Taxpayers list shows all records; open one — trade name + tax types intact.
- [ ] View an existing COR file (signed URL) — Phase 2 proves storage bytes moved.
- [ ] Upload a new COR → OCR review panel appears → apply → save.
- [ ] Open an existing filing; edit a value; confirm autosave (reload page).
- [ ] Create a new filing end-to-end; export eBIRForms XML; byte-compare with
      one exported from the old environment for the same data.
- [ ] Print preview renders the A4 PDF.
- [ ] Deep-link a route (e.g. `/taxpayers`) directly — nginx SPA fallback works.
- [ ] Hard refresh after an env change — `/env.js` is not cached (`no-store`).

## Cost & ops summary

| | Before | After |
|---|---|---|
| Web hosting | Vercel (free/pro) | Sliplane server (flat monthly, per server) |
| DB/Auth/Storage | Supabase cloud (managed, backed up) | Self-hosted Supabase on a second Sliplane server — **you own backups, upgrades, security** |
| Deploys | Vercel on push to `main` | Sliplane on push to `main` (same Auto-PR flow) |

If the main goal is *leaving Vercel* rather than *leaving Supabase*, stopping
after Phase 1 is a perfectly good end state: one Sliplane server, zero new
operational burden, and the option to do Phase 2 later.

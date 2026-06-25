# Sentire BIR Form Generator

Production React + TypeScript + Vite app for generating Philippine BIR tax forms.
Rebuilt from the HTML/React-via-Babel prototype in `design_handoff_bir_form_generator/`
(kept for reference only — not part of the build).

## Commands

- `npm run dev` — start the dev server
- `npm run build` — typecheck (`tsc --noEmit`) + production build
- `npm test` — run the Vitest compute test-suite
- `npm run lint` — typecheck only

## Architecture

- `src/lib/compute/` — pure, unit-tested tax engines (one module + result type per
  form) and the `computeFor` dispatcher. **Highest-value code; keep it pure and
  covered by tests.** Computed values are never stored — always derived.
- `src/lib/` — `format` (peso rounding/formatting), `taxTables` (TRAIN), `catalog`,
  `summary`, `xml/` (eBIRForms export), `repository/` (typed, swappable store +
  React context; localStorage-backed).
- `src/components/` — `shell/` (sidebar, dashboard, new-form, taxpayers), `editor/`
  (Guided/Form toggle, zoom, autosave, print, rail), `formkit/` + `formparts/`
  (faithful-form atoms/sections), `forms/` + `guided/` (one faithful view + one
  wizard per form, plus dispatchers).
- `src/types/` — `Taxpayer`, `Filing`, `FilingData`, per-form row types.

Two views per form: a Google-Forms-style **Guided** wizard and a pixel-faithful,
A4 printable **Form** view. Keep both in sync via the shared `computeFor` result.

## PR & merge convention (standing rule)

Feature work lands on `claude/**` branches. On push, the **Auto PR** workflow
(`.github/workflows/auto-pr.yml`) opens a PR into `main` and enables **squash
auto-merge**; the **CI** workflow (`.github/workflows/ci.yml`) is the gate
(typecheck + build + tests). When working a branch, ensure CI is green before it
auto-merges. See `.github/workflows/auto-pr.yml` for the one-time repo settings
("Allow auto-merge" + a branch-protection required check on `main`).

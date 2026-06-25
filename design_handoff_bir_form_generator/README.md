# Handoff: Sentire BIR Form Generator

## Overview
A web app for generating **Philippine BIR (Bureau of Internal Revenue) tax forms**. It replicates the eBIRForms experience but is friendlier and PDF/print-export ready. Users register **taxpayers** (individuals or corporations) once, then generate any of **nine BIR forms** for them. Each form offers two views:

1. **Guided mode** — a Google-Forms-style, by-Part wizard (tabs per form Part) with plain-language questions, profile auto-fill, live computation, and a review step.
2. **Form mode** — a pixel-faithful, A4-sized replica of the official BIR paper form with inline editable fields, auto-computed totals, and print/PDF output.

Every filing is **saved locally per taxpayer + period** and can be reopened. The app is Sentire-branded (an HR/payroll product).

## About the Design Files
The files in this bundle are **design references created in HTML/React (via in-browser Babel)** — a working prototype showing the intended look, behavior, and tax computation logic. They are **not** meant to be shipped as-is. The task is to **recreate this app in the target codebase's environment** (e.g. a real React/Next.js + bundler setup, or Vue, etc.) using its established patterns, build tooling, and component library. If no environment exists yet, pick the most appropriate stack (React + TypeScript + Vite is a natural fit given the current structure) and implement there.

The **tax computation logic** (`bir-compute2.jsx`, `compute1701A` in `bir-data.jsx`) and the **field structures** of each form are the most valuable, reusable parts — port these faithfully; they encode real BIR rules (TRAIN graduated tables, OSD 40%, 8% flat, 12% VAT, MCIT, percentage-tax ATC rates).

## Fidelity
**High-fidelity (hifi).** Form mode is a pixel-faithful replica of the official BIR forms (item numbers, fine print, box grids, A4 sizing with 0.5" margins, WYSIWYG print). Recreate it precisely. Guided mode is a polished, final-design wizard. Colors, typography, and spacing are final (tokens below).

## The Nine Forms
| Code | Name | Filer | Pages | Key computation |
|---|---|---|---|---|
| **1701A** | Annual ITR | Individual — purely business/profession | 2 | Graduated+OSD OR 8% flat; credits; penalties |
| **1701** | Annual ITR | Individual — mixed income | 2 | Compensation + business; itemized/OSD; graduated/8% |
| **1701Q** | Quarterly ITR | Individuals, estates, trusts | 2 | Cumulative quarter; Sch I graduated, Sch II 8% |
| **1702-RT** | Annual ITR | Corporation — regular rate | 2 | Net tax vs **MCIT 2%** (higher); itemized/OSD-40%-of-gross |
| **1702Q** | Quarterly ITR | Corporation / non-individual | 2 | Cumulative; regular vs MCIT |
| **2550Q** | Quarterly VAT | VAT-registered | 3 | 12% output − allowable input tax; full Part IV + Part V schedules |
| **2551Q** | Quarterly Percentage Tax | Non-VAT | 2 | Schedule 1 ATC × rate; full ATC reference table |
| **2307** | Cert. of Creditable Tax Withheld | Withholding agent → payee | 1 | Monthly income payments + tax withheld totals |
| **2316** | Cert. of Compensation Payment | Employer → employee | 1 | Non-taxable vs taxable comp; tax due vs withheld |

## App Structure / Screens

### 1. Shell (sidebar + main)
- **Layout**: CSS grid `232px 1fr`, full viewport height.
- **Sidebar** (`.s-side`): dark gradient `linear-gradient(168deg, #2E241C, #1f1813)`, 18px/14px padding. Brand block (Sentire mark in a 40×40 rounded tile + "Sentire / BIR Form Generator"). Nav items: **Filings**, **New Form**, **Taxpayers**. Active item = orange `#E8693A` background, white text. Footer note at bottom.
- **Main** (`.s-main`): scrollable, `#F6F2EC` background.

### 2. Filings dashboard (`Dashboard`)
- Header: "Filings" (25px Instrument Sans 600) + subtitle + "New Form" primary button (top right).
- Table of saved filings: columns Form (chip + name) · Taxpayer · Period · Amount Payable · Updated · delete icon. Row hover `#faf7f2`, click opens the editor.
- Form chip: pill, `min-width:52px height:26px`, tinted by category color (`color-mix(in srgb, var(--fc) 13%, #fff)`, text = category color).
- Empty state: dashed border card, centered icon tile, CTA.

### 3. New Form (`NewFiling`)
- Step 1: pick a form. Forms grouped by category (Income Tax / Business Tax / Withholding) with a category label in the category color. Form cards (`.s-formcard`, `repeat(auto-fill, minmax(220px,1fr))` grid) show code (17px, category color), name, sub. Selected = ring `0 0 0 2px color-mix(...)`. Not-ready forms show a "soon" tag and are disabled.
- Step 2: pick taxpayer (`.s-tpcard` list, avatar + name + TIN/kind, selected ring + check).
- Footer: Cancel + "Generate Form" (disabled until form + taxpayer chosen).

### 4. Taxpayers (`TaxpayersView`)
- Grid of taxpayer tiles (`repeat(auto-fill, minmax(240px,1fr))`). Each tile: avatar (rounded square; `#A0627D` for individual, `#5E7FB1` for non-individual), kind tag, name, TIN/RDO, location, filing count.
- **Taxpayer editor modal** (`TaxpayerEditor`): segmented control **Individual / Non-Individual (Company)**.
  - Individual fields: Last/First/Middle Name, TIN, Branch, RDO, Address, City, ZIP, Classification, Email, Contact, Citizenship, **Date of Birth**, Civil Status, Taxpayer Type.
  - Non-Individual fields: Registered Name, TIN, Branch, RDO, Address, City, ZIP, Classification, Email, Contact, Citizenship, **Date of Incorporation** (this replaces Date of Birth for companies — important).
  - Footer: Delete (left, only when editing) · Cancel · Save.

### 5. Editor (`Editor`) — the core screen
- **Top bar** (`.s-ebar`): back button · form chip · form name + taxpayer/TIN · **Guided / Form** segmented toggle · saved chip ("Saving…/Saved", 450ms debounce) · (Form mode only) zoom controls (− / Fit / +) · **Export XML** button · **Print / Save as PDF** primary button.
- **Body** (`.s-ebody`): in Guided mode it's `1fr 268px` (wizard + summary rail); in Form mode it's `1fr` (full-width document, rail hidden).
- **Form mode** (`.s-stage`, grey `#e9e3d9` backdrop, scrollable): the `.bir-doc` document scaled by CSS `zoom`. Each page is a `.bir-sheet` (A4: `width:1044px; min-height:1470px; padding:63px` = 0.5" margins).
- **Guided mode** (`.g-scroll`): tabs row + question card + Back/Next nav. See Guided section.
- **Summary rail** (`.s-rail`, Guided only): Summary (form-specific computed rows), Checklist (validation warnings), XML Exports list, Taxpayer card with "Edit taxpayer details".

## Guided Wizard (per-Part)
- **Tabs** (`.g-tabs`): one per form Part (e.g. "Part I / Details", "Part IV / Income", "Review"). Numbered dot, turns green check when passed, `#A0627D` (tax color) when active. Clickable to jump.
- **Card** (`.g-card`): 6px top gradient bar (`#A0627D → #c08aa3`), eyebrow (part), title (22px), description, then the step's questions.
- **Question primitives** (shared kit `makeGuided(data, set)`):
  - `Money` — peso input, rounds on blur. `ro` variant = dashed read-only computed.
  - `Txt`, `YesNo` (segmented), `Seg`, `Cards` (radio cards w/ optional code + note), `Q` (label + item no + help), `Result` (highlighted summary strip; last row big), `ReadOnly` (auto-filled-from-profile panel).
- **Nav** (`.g-nav`): Back (disabled on first) · "Step N of M" · Next / Finish.
- **Review step**: result summary + "View official form" + "Print / Save as PDF" buttons.
- Live computation: every keystroke recomputes; results show in the in-step `Result` strip AND the right rail.

## Interactions & Behavior
- **Auto-save**: every field change writes to localStorage immediately; "Saved" chip debounced 450ms.
- **Profile auto-fill**: TIN, name, RDO, address, ZIP, DOB/incorp date, email, phone, citizenship are pulled from the taxpayer record and shown read-only on the forms (`BirVal`).
- **Computation**: pure functions per form (`computeFor(form, data)`), recomputed on every render. Outputs flow into both the faithful form's read-only cells and the guided result strips.
- **Branching**: tax-rate / method choices change which questions and form sections are active/dimmed (e.g. 8% vs graduated; itemized vs OSD; MCIT warning when 2% MCIT > normal tax).
- **Print/PDF**: `@page { size: A4; margin: 0 }` (the 0.5" margin is baked into `.bir-sheet` padding for true WYSIWYG). Print CSS hides sidebar/topbar/rail, resets zoom, `page-break-after: always` per sheet. Guided mode switches to Form mode before printing.
- **XML export** (`bir-xml.jsx`): generates eBIRForms-format XML (`<?xml?>` + `KEY=VALUE` encoded blocks). **Currently implemented for 1701A only**; the button warns for other forms. Extending to all forms is a known TODO.
- **Zoom**: Fit (default, fits document width) or manual 50%–160% via CSS `zoom`.

## State Management
- **Single localStorage key**: `sentire_bir_v2`. Shape: `{ taxpayers: {id: Taxpayer}, filings: {id: Filing}, seq: number }`.
- **Taxpayer**: `{ id, kind: 'individual'|'non-individual', regName, lastName, firstName, middleName, tin, branch, rdo, address, city, zip, birthdate, incorpDate, email, phone, citizenship, civilStatus, taxpayerType, classification, createdAt, updatedAt }`.
- **Filing**: `{ id, form, taxpayerId, status:'draft', period, data:{...raw field values...}, exports:[{filename,xml,at}], createdAt, updatedAt }`. `data` holds raw string inputs keyed by field id (e.g. `i36A`, `salesA`, `rows:[{atc,taxable,rate}]`); computed values are never stored — always derived via `computeFor`.
- Seed data: one sample company (Aurora Digital Solutions Inc.) + one individual (Maria Dela Cruz) on first run.
- Routing is in-memory React state (`route = {view, filingId|editId}`), not URL-based.

## Tax Computation Rules (port these exactly — see `bir-compute2.jsx`)
- **Graduated income tax (TRAIN)**: two tables — 2018–2022 and 2023-onward (selected by the return's year). Defined in `bir-data.jsx` (`TAX_TABLE_1`, `TAX_TABLE_2`, `graduatedTax`).
- **Peso rounding**: BIR rule "no centavos; 49c down, 50c up" → `roundPeso(n) = sign(n) * round(abs(n))`.
- **OSD**: individuals 40% of net sales; **corporations 40% of gross income**.
- **8% flat**: 8% on (gross sales + other income − ₱250,000 relief for taxpayer).
- **VAT**: output = 12% × VATable sales; net = adjusted output − total allowable input tax.
- **Percentage tax**: per-line taxable amount × ATC rate (rates in the form's ATC table).
- **MCIT (corporate)**: 2% of gross income; tax due = max(normal tax, MCIT). Regular rate default 25% (20% for small corps).
- **2316**: graduated tax on gross taxable compensation; compare to taxes withheld.

## Design Tokens
```
/* Brand */
--acc (orange):        #E8693A   --acc-press: #C2552F   --acc-soft: #fdeee6
--tax (plum, accent):  #A0627D   --tax-soft:  #f5ebf0
--ink:                 #2A2420   --muted: #6B6259   --muted-2: #9b9085
--bg:                  #F6F2EC   --paper: #ffffff
--line:                #ECE6DD   --line-2: #f1ece4
--side gradient:       #2E241C → #1f1813
/* Category colors */
Income Tax:  #A0627D    Business Tax: #5E7FB1    Withholding: #4F9373
/* Form-ink palette (the BIR document) */
ink #1a1a1a · lines #2a2a2a · header-shade #d9d9d9 · field-tint #fffdf6 · field-focus #fff6cf · readonly #f3f4f6 · entered-value-blue #16263a

/* Typography */
UI headings: "Instrument Sans" (600/700)
UI body:     "Hanken Grotesk" (400–700)
Form (document): Arial / Helvetica  — sizes 8.6px–21px; item labels ~10.6px, inputs 15px, title 21px
Radius: 7–16px (cards 12–16, chips 7, inputs 9–11)
Shadow (cards): 0 6px 22px rgba(40,28,18,.07); sheet: 0 6px 26px rgba(40,28,18,.16)
```
Currency display: `₱ ` + `toLocaleString('en-PH')`, no decimals; negatives in parentheses `(1,234)`.

## Assets
- `assets/bir-seal.png` — official BIR seal (used in every form header). Source: provided by user.
- `assets/sentire-mark.svg`, `sentire-mark-dark.svg`, `sentire-app-icon.svg` — Sentire brand marks (from the Sentire logo kit). The sidebar mark is drawn inline as SVG (see `Mark` in `bir-shell.jsx`).
- Icons are inline SVG path strings (`SIco` object in `bir-shell.jsx`), Feather-style, 1.7 stroke.
- Fonts via Google Fonts: Instrument Sans, Hanken Grotesk.

## Files (in this bundle, under `bir/`)
**Data + logic**
- `bir-data.jsx` — localStorage store, Taxpayers/Filings CRUD, CATALOG (form list), formatting helpers, TRAIN tax tables, `compute1701A`.
- `bir-compute2.jsx` — `compute` functions for the other 8 forms + `computeFor(form,data)` dispatcher.
- `bir-xml.jsx` — eBIRForms XML export (1701A).

**Faithful form replicas** (one per form; 1701A split into p1/p2)
- `form-1701A-p1.jsx`, `form-1701A-p2.jsx`, `form-1701.jsx`, `form-1701Q.jsx`, `form-1702RT.jsx`, `form-1702Q.jsx`, `form-2550Q.jsx`, `form-2551Q.jsx`, `form-2307.jsx`, `form-2316.jsx`.
- `bir-formkit.jsx` — shared form atoms: `BirBoxes` (digit boxes), `BirAmt` (amount input), `BirText`, `BirVal` (read-only profile value), `BirCk`/`BirCkRow` (checkboxes).
- `bir-formparts.jsx` — shared form sections: `BirHeader`, `PartBand`, `BgInfoReturn`, `PaymentDetails`, `DeclSign`, `LineAmt`.
- `bir-form.css` — all faithful-form styling (sheet sizing, cells, inputs, boxes, tables).

**Guided wizards**
- `bir-guided-kit.jsx` — `makeGuided(data,set)` field factory + `GuidedShell` (tabs/card/nav) + `gName`.
- `bir-guided-1701A.jsx` (standalone, predates the kit), `bir-guided-returns.jsx` (1701, 1701Q, 2550Q, 2551Q), `bir-guided-corp.jsx` (1702-RT, 1702Q), `bir-guided-certs.jsx` (2307, 2316).

**Shell**
- `bir-shell.jsx` — `BIRApp` root, Sidebar, Dashboard, NewFiling, icons (`SIco`), `Mark`, helpers.
- `bir-shell2.jsx` — `Editor` (mode toggle, zoom, print, rail), `renderForm`/`renderGuided` dispatchers, `railSummary`, `TaxpayersView`, `TaxpayerEditor`, `Field`.

**Entry**
- `BIR Form Generator.html` — loads React 18 + Babel standalone, all the above scripts in order, mounts `<BIRApp/>`. Contains all app-shell CSS and print CSS in a `<style>` block.

## Load order (important for the recreation)
`bir-data.jsx` → `bir-compute2.jsx` → `bir-xml.jsx` → `bir-formkit` → `bir-formparts` → form-*.jsx → `bir-shell` → `bir-shell2` → `bir-guided-kit` → guided-*.jsx → mount. In a real bundler this becomes explicit imports; components currently communicate via `window` globals (replace with ES module imports).

## Recommended target architecture
- React + TypeScript + Vite. Type the `Taxpayer`, `Filing`, and per-form `data` shapes.
- Move computation into pure, unit-tested modules (`/lib/compute/*.ts`) — they're framework-agnostic and the highest-value asset to verify with tests.
- Replace `window`-global wiring with proper imports. Replace localStorage store with a small typed repository (swappable for a backend later).
- Keep the two-view pattern (Guided wizard + faithful printable form) — it's the core UX.
- Consider real PDF generation (server-side or `@react-pdf`) if browser print isn't sufficient, but the current `@page A4` print path already produces correct output.
```

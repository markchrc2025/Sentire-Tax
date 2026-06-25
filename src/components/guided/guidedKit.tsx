// guidedKit.tsx — shared primitives + shell for the guided wizards.
// Ported from bir-guided-kit.jsx (makeGuided field factory, GuidedShell, gName).

import { useState, type ReactNode } from "react";
import type { FilingData, Taxpayer } from "../../types";
import { fmtAmt, num, roundPeso } from "../../lib/format";
import { Icon, SIco } from "../icons";
import type { SetFn } from "../formkit";

export interface SegOption {
  val: string;
  label: string;
}
export interface CardOption {
  val: string;
  title: string;
  code?: string;
  note?: string;
}
export interface ResultRow {
  label: string;
  value: ReactNode;
  big?: boolean;
  /** When false, render `value` as-is instead of formatting it as pesos. */
  peso?: boolean;
}
export interface ReadOnlyItem {
  label: string;
  value: ReactNode;
}

/**
 * Given (data, set), returns a set of field components bound to that data.
 * Mirrors the prototype's `makeGuided`.
 */
export function makeGuided(data: FilingData, set: SetFn) {
  const is = (f: string, v: string) => data[f] === v;
  const pick = (f: string, v: string) => set(f, v);
  const rawStr = (f: string) => {
    const x = data[f];
    return x == null || typeof x !== "string" ? "" : x;
  };

  const Money = ({ field, value, ro }: { field?: string; value?: number; ro?: boolean }) => {
    if (ro) {
      return (
        <div className="g-money ro">
          <span className="peso">₱</span>
          <input value={fmtAmt(value == null ? 0 : value)} readOnly tabIndex={-1} />
        </div>
      );
    }
    return (
      <div className="g-money">
        <span className="peso">₱</span>
        <input
          inputMode="decimal"
          value={field ? rawStr(field) : ""}
          placeholder="0"
          onChange={(e) => field && set(field, e.target.value.replace(/[^0-9.\-]/g, ""))}
          onBlur={(e) => {
            if (!field) return;
            const n = num(e.target.value);
            set(field, e.target.value.trim() === "" ? "" : String(roundPeso(n)));
          }}
        />
      </div>
    );
  };

  const Txt = ({ field, ph, up, maxw }: { field: string; ph?: string; up?: boolean; maxw?: number }) => (
    <input
      className={"g-text" + (up ? " up" : "")}
      style={maxw ? { maxWidth: maxw } : undefined}
      value={rawStr(field)}
      placeholder={ph || ""}
      onChange={(e) => set(field, e.target.value)}
    />
  );

  const YesNo = ({ field }: { field: string }) => (
    <div className="g-seg2">
      <button className={is(field, "yes") ? "on" : ""} onClick={() => pick(field, "yes")}>
        Yes
      </button>
      <button className={is(field, "no") ? "on" : ""} onClick={() => pick(field, "no")}>
        No
      </button>
    </div>
  );

  const Seg = ({ field, options }: { field: string; options: SegOption[] }) => (
    <div className="g-seg2">
      {options.map((o) => (
        <button key={o.val} className={is(field, o.val) ? "on" : ""} onClick={() => pick(field, o.val)}>
          {o.label}
        </button>
      ))}
    </div>
  );

  const Cards = ({ field, options, cols }: { field: string; options: CardOption[]; cols?: number }) => (
    <div className={"g-choice" + (cols === 2 ? " c2" : "")}>
      {options.map((o) => (
        <button key={o.val} className={"g-opt" + (is(field, o.val) ? " on" : "")} onClick={() => pick(field, o.val)}>
          <div className="g-opt-t">
            {o.code && <span className="g-opt-code">{o.code}</span>}
            {o.title}
          </div>
          {o.note && <div className="g-opt-note">{o.note}</div>}
          <span className="g-opt-check">{is(field, o.val) && <Icon d={SIco.check} size={12} />}</span>
        </button>
      ))}
    </div>
  );

  const Q = ({
    item,
    label,
    help,
    req,
    children,
  }: {
    item?: string;
    label: ReactNode;
    help?: string;
    req?: boolean;
    children: ReactNode;
  }) => (
    <div className="g-q">
      <label className="g-q-label">
        {item && <span className="g-q-item">{item} · </span>}
        {label}
        {req && <span className="req">*</span>}
      </label>
      {help && <p className="g-q-help">{help}</p>}
      {children}
    </div>
  );

  const Result = ({ rows }: { rows: ResultRow[] }) => (
    <div className="g-result hl">
      {rows.map((r, i) => (
        <div key={i} className={"g-result-row" + (r.big ? " big" : "")}>
          <span>{r.label}</span>
          <b>{r.peso === false ? r.value : "₱ " + fmtAmt(r.value as number)}</b>
        </div>
      ))}
    </div>
  );

  const ReadOnly = ({ items }: { items: ReadOnlyItem[] }) => (
    <div className="g-readonly">
      <div className="g-readonly-h">
        <Icon d={SIco.check} size={13} />
        Auto-filled from taxpayer profile
      </div>
      <div className="g-ro-grid">
        {items.map((it, i) => (
          <div className="g-ro-item" key={i}>
            <i>{it.label}</i>
            <b>{it.value || "—"}</b>
          </div>
        ))}
      </div>
    </div>
  );

  return { is, pick, Money, Txt, YesNo, Seg, Cards, Q, Result, ReadOnly };
}

export interface GuidedStep {
  part: string;
  tab: string;
  title: string;
  desc: string;
  render: () => ReactNode;
}

/** Shared shell: renders the Part tabs, the question card, and Back/Next nav. */
export function GuidedShell({
  steps,
  onViewForm,
  onPrint,
}: {
  steps: GuidedStep[];
  onViewForm: () => void;
  onPrint: () => void;
}) {
  const [step, setStep] = useState(0);
  const cur = steps[step];
  const lastIdx = steps.length - 1;
  return (
    <div className="g-scroll">
      <div className="g-shell">
        <div className="g-tabs" role="tablist">
          {steps.map((s, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === step}
              className={"g-tab" + (i === step ? " on" : i < step ? " done" : "")}
              onClick={() => setStep(i)}
            >
              <span className="g-tab-dot">{i < step ? <Icon d={SIco.check} size={10} /> : i + 1}</span>
              <span className="g-tab-lbl">
                <b>{s.part}</b>
                <i>{s.tab}</i>
              </span>
            </button>
          ))}
        </div>
        <div className="g-card">
          <div className="g-card-top" />
          <div className="g-card-body">
            <div className="g-eyebrow">{cur.part}</div>
            <h2 className="g-title">{cur.title}</h2>
            <p className="g-desc">{cur.desc}</p>
            {cur.render()}
            {step === lastIdx && (
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button className="s-btn s-btn-primary" onClick={onViewForm}>
                  <Icon d={SIco.file} size={16} />
                  View official form
                </button>
                <button className="s-btn" onClick={onPrint}>
                  <Icon d={SIco.print} size={16} />
                  Print / Save as PDF
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="g-nav">
          <button
            className="s-btn"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            style={step === 0 ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
          >
            <Icon d={SIco.back} size={16} />
            Back
          </button>
          <span className="g-nav-mid">
            Step {step + 1} of {steps.length}
          </span>
          {step < lastIdx ? (
            <button className="s-btn s-btn-primary" onClick={() => setStep((s) => Math.min(lastIdx, s + 1))}>
              Next
              <Icon d={SIco.chevR} size={16} />
            </button>
          ) : (
            <button className="s-btn s-btn-primary" onClick={onViewForm}>
              Finish
              <Icon d={SIco.check} size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Profile display-name helper for the wizards. */
export function gName(tp: Taxpayer | null): string {
  if (!tp) return "";
  return tp.kind === "individual"
    ? [tp.lastName, tp.firstName, tp.middleName].filter(Boolean).join(", ")
    : tp.regName;
}

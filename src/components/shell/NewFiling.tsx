// NewFiling.tsx — pick a form + year + taxpayer, then open /{form}/{year}/{tin}.
// Filing the same form + period twice for one taxpayer is only allowed as an
// amended return: the duplicate gets a version suffix in the URL ("1701v1")
// and the user must confirm "Is this an Amended Return?" = Yes to proceed.

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CATALOG, CATEGORIES, FORM_COLOR } from "../../lib/catalog";
import { buildPeriod, filingVersion, formSegment, isQuarterlyForm } from "../../lib/period";
import { displayName, initials, normalizeTin } from "../../lib/taxpayer";
import { useRepository } from "../../lib/repository/RepositoryProvider";
import type { FormCode } from "../../types";
import { Icon, SIco } from "../icons";

export function NewFiling() {
  const { repo } = useRepository();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormCode | null>(null);
  const [tpId, setTpId] = useState("");
  const [year, setYear] = useState("");
  const [quarter, setQuarter] = useState("Q1");
  const [amendedChoice, setAmendedChoice] = useState<"" | "yes" | "no">("");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const taxpayers = repo.taxpayers.all();
  const selectedTp = taxpayers.find((t) => t.id === tpId);
  const tin = normalizeTin(selectedTp?.tin);
  const tinMissing = Boolean(tpId && !tin);
  const quarterly = isQuarterlyForm(form ?? undefined);
  const period = year.trim() ? buildPeriod(year, quarterly ? quarter : undefined) : "";
  const canGenerate = Boolean(form && tpId && period && tin);

  // Existing filings for this exact form + period + taxpayer (any version).
  const existing =
    form && tpId && period
      ? repo.filings.all().filter((f) => f.form === form && f.taxpayerId === tpId && f.period === period)
      : [];
  const nextVersion = existing.length ? Math.max(...existing.map(filingVersion)) + 1 : 0;

  // A different form/period/taxpayer is a different question — reset the answer.
  useEffect(() => {
    setAmendedChoice("");
  }, [form, tpId, period]);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  }

  function generate() {
    if (!form || !tin || !period) return;
    if (existing.length > 0) {
      if (amendedChoice !== "yes") {
        showToast("Filing cannot proceed. Detected duplicate form and year.");
        return;
      }
      navigate(`/${formSegment(form, nextVersion)}/${encodeURIComponent(period)}/${tin}`);
      return;
    }
    navigate(`/${form}/${encodeURIComponent(period)}/${tin}`);
  }

  return (
    <div className="s-page">
      <div className="s-head">
        <div>
          <h1>New Form</h1>
          <p>Choose a BIR form, the taxable year, then the taxpayer it&rsquo;s for.</p>
        </div>
      </div>

      <div className="s-step-lbl">1 · Select a form</div>
      {CATEGORIES.map((cat) => (
        <div key={cat} style={{ marginBottom: 14 }}>
          <div className="s-cat-lbl" style={{ ["--fc" as string]: FORM_COLOR[cat] }}>
            {cat}
          </div>
          <div className="s-formgrid">
            {CATALOG.filter((c) => c.cat === cat).map((c) => (
              <button
                key={c.code}
                className={"s-formcard" + (form === c.code ? " sel" : "") + (c.ready ? "" : " soon")}
                onClick={() => c.ready && setForm(c.code)}
                style={{ ["--fc" as string]: FORM_COLOR[cat] }}
              >
                <div className="s-formcard-code">
                  {c.code}
                  {!c.ready && <span className="s-soon">soon</span>}
                </div>
                <div className="s-formcard-name">{c.name}</div>
                <div className="s-formcard-sub">{c.sub}</div>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="s-step-lbl" style={{ marginTop: 8 }}>
        2 · Taxable {quarterly ? "year & quarter" : "year"}
      </div>
      <div style={{ display: "flex", gap: 11, alignItems: "flex-end", flexWrap: "wrap" }}>
        <label className="s-field" style={{ maxWidth: 160 }}>
          <span>Year</span>
          <input value={year} placeholder="2024" onChange={(e) => setYear(e.target.value)} />
        </label>
        {quarterly && (
          <label className="s-field" style={{ maxWidth: 120 }}>
            <span>Quarter</span>
            <select value={quarter} onChange={(e) => setQuarter(e.target.value)}>
              <option value="Q1">Q1</option>
              <option value="Q2">Q2</option>
              <option value="Q3">Q3</option>
              <option value="Q4">Q4</option>
            </select>
          </label>
        )}
        {period && (
          <div className="s-muted-sm" style={{ paddingBottom: 9 }}>
            URL period: <b>{period}</b>
          </div>
        )}
      </div>

      <div className="s-step-lbl" style={{ marginTop: 20 }}>
        3 · Select the taxpayer
      </div>
      {taxpayers.length === 0 ? (
        <div className="s-inline-note">
          No taxpayers yet. <Link to="/taxpayers">Add a taxpayer →</Link>
        </div>
      ) : (
        <div className="s-tplist">
          {taxpayers.map((tp) => (
            <button
              key={tp.id}
              className={"s-tpcard" + (tpId === tp.id ? " sel" : "")}
              onClick={() => setTpId(tp.id)}
            >
              <div className={"s-tpavatar " + tp.kind}>{initials(displayName(tp))}</div>
              <div className="s-tpcard-txt">
                <b>{displayName(tp)}</b>
                <i>
                  TIN {normalizeTin(tp.tin) || "—"} · {tp.kind === "individual" ? "Individual" : "Non-Individual"}
                </i>
              </div>
              {tpId === tp.id && (
                <span className="s-tpcheck">
                  <Icon d={SIco.check} size={15} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {tinMissing && (
        <div className="s-inline-note" style={{ marginTop: 12 }}>
          This taxpayer has no TIN yet — add one in <Link to="/taxpayers">Taxpayers</Link> first (the TIN is part of
          the filing&rsquo;s address).
        </div>
      )}

      {existing.length > 0 && form && (
        <div className="s-dupe">
          <div className="s-dupe-head">
            <Icon d={SIco.warn} size={16} />
            <span>
              A <b>{form}</b> for <b>{period}</b> already exists for this taxpayer. Filing it again will create{" "}
              <b>{form}</b>
              <span className="s-verchip">v{nextVersion}</span> — that is only allowed as an amended return.
            </span>
          </div>
          <div className="s-dupe-q">
            <span>Is this an Amended Return?</span>
            <label>
              <input
                type="radio"
                name="nf-amended"
                checked={amendedChoice === "yes"}
                onChange={() => setAmendedChoice("yes")}
              />
              Yes
            </label>
            <label>
              <input
                type="radio"
                name="nf-amended"
                checked={amendedChoice === "no"}
                onChange={() => setAmendedChoice("no")}
              />
              No
            </label>
          </div>
        </div>
      )}

      <div className="s-step-actions">
        <button className="s-btn" onClick={() => navigate("/filings")}>
          Cancel
        </button>
        <button className="s-btn s-btn-primary" disabled={!canGenerate} onClick={generate}>
          Generate Form
          <Icon d={SIco.chevR} size={16} />
        </button>
      </div>

      {toast && (
        <div className="s-toast err">
          <Icon d={SIco.warn} size={16} />
          <div>
            <b>Duplicate filing</b>
            <span>{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}

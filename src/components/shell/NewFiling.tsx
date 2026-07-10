// NewFiling.tsx — pick a form + year + taxpayer, then open /{form}/{year}/{tin}.

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CATALOG, CATEGORIES, FORM_COLOR } from "../../lib/catalog";
import { buildPeriod, isQuarterlyForm } from "../../lib/period";
import { displayName, initials, normalizeTin } from "../../lib/taxpayer";
import { useRepository } from "../../lib/repository/RepositoryProvider";
import type { FormCode } from "../../types";
import { Icon, SIco } from "../icons";
import { ImportFromPortal } from "./ImportFromPortal";

export function NewFiling() {
  const { repo } = useRepository();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormCode | null>(null);
  const [tpId, setTpId] = useState("");
  const [year, setYear] = useState("");
  const [quarter, setQuarter] = useState("Q1");
  const taxpayers = repo.taxpayers.all();
  const selectedTp = taxpayers.find((t) => t.id === tpId);
  const tin = normalizeTin(selectedTp?.tin);
  const tinMissing = Boolean(tpId && !tin);
  const quarterly = isQuarterlyForm(form ?? undefined);
  const period = year.trim() ? buildPeriod(year, quarterly ? quarter : undefined) : "";
  const canGenerate = Boolean(form && tpId && period && tin);

  function generate() {
    if (!form || !tin || !period) return;
    navigate(`/${form}/${encodeURIComponent(period)}/${tin}`);
  }

  return (
    <div className="s-page">
      <div className="s-head">
        <div>
          <h1>New Form</h1>
          <p>Choose a BIR form, the taxable year, then the taxpayer it&rsquo;s for.</p>
        </div>
        <ImportFromPortal />
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

      <div className="s-step-actions">
        <button className="s-btn" onClick={() => navigate("/filings")}>
          Cancel
        </button>
        <button className="s-btn s-btn-primary" disabled={!canGenerate} onClick={generate}>
          Generate Form
          <Icon d={SIco.chevR} size={16} />
        </button>
      </div>
    </div>
  );
}

// NewFiling.tsx — pick a form + taxpayer, then generate a filing.
// Ported from NewFiling in bir-shell.jsx.

import { useState } from "react";
import { CATALOG, CATEGORIES, FORM_COLOR } from "../../lib/catalog";
import { displayName, formatTin, initials } from "../../lib/taxpayer";
import { useRepository } from "../../lib/repository/RepositoryProvider";
import type { FormCode } from "../../types";
import { Icon, SIco } from "../icons";
import type { SetRoute } from "../route";

export function NewFiling({
  setRoute,
  newFiling,
}: {
  setRoute: SetRoute;
  newFiling: (form: FormCode, taxpayerId: string) => void;
}) {
  const { repo } = useRepository();
  const [form, setForm] = useState<FormCode | null>(null);
  const [tpId, setTpId] = useState("");
  const taxpayers = repo.taxpayers.all();

  return (
    <div className="s-page">
      <div className="s-head">
        <div>
          <h1>New Form</h1>
          <p>Choose a BIR form, then the taxpayer it&rsquo;s for.</p>
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
        2 · Select the taxpayer
      </div>
      {taxpayers.length === 0 ? (
        <div className="s-inline-note">
          No taxpayers yet. <a onClick={() => setRoute({ view: "taxpayers" })}>Add a taxpayer →</a>
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
                  TIN {formatTin(tp.tin) || "—"} · {tp.kind === "individual" ? "Individual" : "Non-Individual"}
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

      <div className="s-step-actions">
        <button className="s-btn" onClick={() => setRoute({ view: "dashboard" })}>
          Cancel
        </button>
        <button
          className="s-btn s-btn-primary"
          disabled={!form || !tpId}
          onClick={() => form && tpId && newFiling(form, tpId)}
        >
          Generate Form
          <Icon d={SIco.chevR} size={16} />
        </button>
      </div>
    </div>
  );
}

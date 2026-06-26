// Dashboard.tsx — saved-filings table. Rows link to /{form}/{period}/{tin}.

import { useNavigate } from "react-router-dom";
import { CATALOG, FORM_COLOR } from "../../lib/catalog";
import { fmtAmt } from "../../lib/format";
import { headlineAmount } from "../../lib/summary";
import { displayName, normalizeTin } from "../../lib/taxpayer";
import { useRepository } from "../../lib/repository/RepositoryProvider";
import type { Filing } from "../../types";
import { Icon, SIco, timeAgo } from "../icons";

export function Dashboard() {
  const { repo, refresh } = useRepository();
  const navigate = useNavigate();
  const filings = repo.filings.all();
  const meta = (code: string) => CATALOG.find((c) => c.code === code);

  const filingPath = (f: Filing): string => {
    const tp = repo.taxpayers.get(f.taxpayerId);
    const tin = normalizeTin(tp?.tin);
    const period = f.period || (typeof f.data?.year === "string" ? f.data.year : "");
    return `/${f.form}/${encodeURIComponent(period || "draft")}/${tin}`;
  };

  return (
    <div className="s-page">
      <div className="s-head">
        <div>
          <h1>Filings</h1>
          <p>Every BIR form you&rsquo;ve generated, saved per taxpayer and period.</p>
        </div>
        <button className="s-btn s-btn-primary" onClick={() => navigate("/new")}>
          <Icon d={SIco.plus} size={16} />
          New Form
        </button>
      </div>

      {filings.length === 0 ? (
        <div className="s-empty">
          <div className="s-empty-mark">
            <Icon d={SIco.file} size={26} />
          </div>
          <h3>No filings yet</h3>
          <p>Generate your first BIR form — pick a form type and a taxpayer.</p>
          <button className="s-btn s-btn-primary" onClick={() => navigate("/new")}>
            <Icon d={SIco.plus} size={16} />
            New Form
          </button>
        </div>
      ) : (
        <div className="s-table">
          <div className="s-tr s-tr-head">
            <div className="s-td-form">Form</div>
            <div className="s-td-tp">Taxpayer</div>
            <div className="s-td-per">Period</div>
            <div className="s-td-amt">Amount Payable</div>
            <div className="s-td-upd">Updated</div>
            <div className="s-td-act"></div>
          </div>
          {filings.map((f) => {
            const tp = repo.taxpayers.get(f.taxpayerId);
            const m = meta(f.form);
            const amt = headlineAmount(f.form, f.data || {});
            const year = typeof f.data?.year === "string" ? f.data.year : "";
            return (
              <div className="s-tr" key={f.id} onClick={() => navigate(filingPath(f))}>
                <div className="s-td-form">
                  <span
                    className="s-formchip"
                    style={{ ["--fc" as string]: (m && FORM_COLOR[m.cat]) || "#6B6259" }}
                  >
                    {f.form}
                  </span>
                  <span className="s-formname">{m?.name}</span>
                </div>
                <div className="s-td-tp">{displayName(tp)}</div>
                <div className="s-td-per">{year ? year : <i className="s-muted">—</i>}</div>
                <div className="s-td-amt">{amt != null ? "₱ " + fmtAmt(amt) : "—"}</div>
                <div className="s-td-upd">{timeAgo(f.updatedAt)}</div>
                <div className="s-td-act">
                  <button
                    className="s-iconbtn"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this filing?")) {
                        repo.filings.remove(f.id);
                        refresh();
                      }
                    }}
                  >
                    <Icon d={SIco.trash} size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

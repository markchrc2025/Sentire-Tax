// Dashboard.tsx — saved-filings table. Ported from Dashboard in bir-shell.jsx.

import { CATALOG, FORM_COLOR } from "../../lib/catalog";
import { fmtAmt } from "../../lib/format";
import { headlineAmount } from "../../lib/summary";
import { displayName } from "../../lib/taxpayer";
import { useRepository } from "../../lib/repository/RepositoryProvider";
import { Icon, SIco, timeAgo } from "../icons";
import type { SetRoute } from "../route";

export function Dashboard({
  setRoute,
  openFiling,
}: {
  setRoute: SetRoute;
  openFiling: (id: string) => void;
}) {
  const { repo, refresh } = useRepository();
  const filings = repo.filings.all();
  const meta = (code: string) => CATALOG.find((c) => c.code === code);

  return (
    <div className="s-page">
      <div className="s-head">
        <div>
          <h1>Filings</h1>
          <p>Every BIR form you&rsquo;ve generated, saved per taxpayer and period.</p>
        </div>
        <button className="s-btn s-btn-primary" onClick={() => setRoute({ view: "new" })}>
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
          <button className="s-btn s-btn-primary" onClick={() => setRoute({ view: "new" })}>
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
              <div className="s-tr" key={f.id} onClick={() => openFiling(f.id)}>
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

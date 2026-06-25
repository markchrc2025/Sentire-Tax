// bir-shell.jsx — Sentire BIR Form Generator · app shell + views
// Exports to window: BIRApp

const { useState, useEffect, useRef, useMemo } = React;

/* ---------------- icons ---------------- */
const SIco = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11",
  plus: "M12 5v14M5 12h14",
  print: "M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z",
  back: "M19 12H5M12 19l-7-7 7-7",
  trash: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z",
  check: "M20 6L9 17l-5-5",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35",
  chevR: "M9 18l6-6-6-6",
  x: "M18 6L6 18M6 6l12 12",
  copy: "M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  warn: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  zoomIn: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35M11 8v6M8 11h6",
  zoomOut: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35M8 11h6",
  code: "M16 18l6-6-6-6M8 6l-6 6 6 6",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
};
function Icon({ d, size = 17, stroke = 1.7, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      {d.split("M").filter(Boolean).map((p, i) => <path key={i} d={"M" + p} />)}
    </svg>
  );
}
function Mark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ display: "block", flex: "none" }}>
      <g stroke="#F7F3EF" strokeWidth="3.4" strokeLinecap="round" opacity="0.5">
        <line x1="24" y1="24" x2="24" y2="11.5" /><line x1="24" y1="24" x2="38.5" y2="24" />
        <line x1="24" y1="24" x2="19.55" y2="36.22" /><line x1="24" y1="24" x2="10.84" y2="19.21" />
      </g>
      <g stroke="#F7F3EF" strokeWidth="2.55" strokeLinecap="round" opacity="0.18">
        <line x1="24" y1="11.5" x2="38.5" y2="24" /><line x1="38.5" y1="24" x2="19.55" y2="36.22" />
        <line x1="19.55" y1="36.22" x2="10.84" y2="19.21" /><line x1="10.84" y1="19.21" x2="24" y2="11.5" />
      </g>
      <circle cx="24" cy="11.5" r="3.68" fill="#F7F3EF" /><circle cx="38.5" cy="24" r="4.13" fill="#F7F3EF" />
      <circle cx="19.55" cy="36.22" r="3.85" fill="#F7F3EF" /><circle cx="10.84" cy="19.21" r="3.43" fill="#F7F3EF" />
      <circle cx="24" cy="24" r="5" fill="#E8693A" />
    </svg>
  );
}

const FORM_COLOR = {
  "Income Tax": "#A0627D", "Business Tax": "#5E7FB1", "Withholding": "#4F9373",
};

/* ---------------- root app ---------------- */
function BIRApp() {
  const { Taxpayers, Filings, CATALOG } = window.BIR;
  const [route, setRoute] = useState({ view: "dashboard" });
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  function openFiling(id) { setRoute({ view: "editor", filingId: id }); }
  function newFiling(formCode, taxpayerId) {
    const f = Filings.create(formCode, taxpayerId);
    openFiling(f.id);
  }

  return (
    <div className="s-app">
      <Sidebar route={route} setRoute={setRoute} />
      <div className="s-main">
        {route.view === "dashboard" && <Dashboard setRoute={setRoute} openFiling={openFiling} tick={tick} refresh={refresh} />}
        {route.view === "taxpayers" && <TaxpayersView refresh={refresh} tick={tick} route={route} />}
        {route.view === "new" && <NewFiling setRoute={setRoute} newFiling={newFiling} />}
        {route.view === "editor" && <Editor filingId={route.filingId} setRoute={setRoute} refresh={refresh} />}
      </div>
    </div>
  );
}

/* ---------------- sidebar ---------------- */
function Sidebar({ route, setRoute }) {
  const nav = [
    { id: "dashboard", label: "Filings", icon: SIco.grid, view: "dashboard" },
    { id: "new", label: "New Form", icon: SIco.plus, view: "new" },
    { id: "taxpayers", label: "Taxpayers", icon: SIco.users, view: "taxpayers" },
  ];
  const active = route.view === "editor" ? "dashboard" : route.view;
  return (
    <aside className="s-side">
      <div className="s-brand">
        <div className="s-brand-tile"><Mark size={26} /></div>
        <div className="s-brand-txt"><b>Sentire</b><i>BIR Form Generator</i></div>
      </div>
      <nav className="s-nav">
        {nav.map((n) => (
          <button key={n.id} className={"s-navitem" + (active === n.id ? " on" : "")} onClick={() => setRoute({ view: n.view })}>
            <Icon d={n.icon} size={18} /><span>{n.label}</span>
          </button>
        ))}
      </nav>
      <div className="s-side-foot">
        <div className="s-side-note">Philippine Bureau of Internal Revenue forms. Auto-computed &amp; saved on this device.</div>
      </div>
    </aside>
  );
}

/* ---------------- dashboard ---------------- */
function Dashboard({ setRoute, openFiling, tick, refresh }) {
  const { Taxpayers, Filings, CATALOG } = window.BIR;
  const filings = Filings.all();
  const meta = (code) => CATALOG.find((c) => c.code === code) || {};
  return (
    <div className="s-page">
      <div className="s-head">
        <div>
          <h1>Filings</h1>
          <p>Every BIR form you’ve generated, saved per taxpayer and period.</p>
        </div>
        <button className="s-btn s-btn-primary" onClick={() => setRoute({ view: "new" })}>
          <Icon d={SIco.plus} size={16} />New Form
        </button>
      </div>

      {filings.length === 0 ? (
        <div className="s-empty">
          <div className="s-empty-mark"><Icon d={SIco.file} size={26} /></div>
          <h3>No filings yet</h3>
          <p>Generate your first BIR form — pick a form type and a taxpayer.</p>
          <button className="s-btn s-btn-primary" onClick={() => setRoute({ view: "new" })}><Icon d={SIco.plus} size={16} />New Form</button>
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
            const tp = Taxpayers.get(f.taxpayerId);
            const m = meta(f.form);
            const amt = f.form === "1701A" ? window.BIR.compute1701A(f.data || {}).i30 : null;
            return (
              <div className="s-tr" key={f.id} onClick={() => openFiling(f.id)}>
                <div className="s-td-form">
                  <span className="s-formchip" style={{ "--fc": FORM_COLOR[m.cat] || "#6B6259" }}>{f.form}</span>
                  <span className="s-formname">{m.name}</span>
                </div>
                <div className="s-td-tp">{Taxpayers.displayName(tp)}</div>
                <div className="s-td-per">{f.data && f.data.year ? f.data.year : <i className="s-muted">—</i>}</div>
                <div className="s-td-amt">{amt != null ? "₱ " + window.BIR.fmtAmt(amt) : "—"}</div>
                <div className="s-td-upd">{timeAgo(f.updatedAt)}</div>
                <div className="s-td-act">
                  <button className="s-iconbtn" title="Delete" onClick={(e) => { e.stopPropagation(); if (confirm("Delete this filing?")) { Filings.remove(f.id); refresh(); } }}>
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

/* ---------------- new filing ---------------- */
function NewFiling({ setRoute, newFiling }) {
  const { Taxpayers, CATALOG } = window.BIR;
  const [form, setForm] = useState(null);
  const [tpId, setTpId] = useState("");
  const taxpayers = Taxpayers.all();
  const cats = ["Income Tax", "Business Tax", "Withholding"];
  return (
    <div className="s-page">
      <div className="s-head"><div><h1>New Form</h1><p>Choose a BIR form, then the taxpayer it’s for.</p></div></div>

      <div className="s-step-lbl">1 · Select a form</div>
      {cats.map((cat) => (
        <div key={cat} style={{ marginBottom: 14 }}>
          <div className="s-cat-lbl" style={{ "--fc": FORM_COLOR[cat] }}>{cat}</div>
          <div className="s-formgrid">
            {CATALOG.filter((c) => c.cat === cat).map((c) => (
              <button key={c.code} className={"s-formcard" + (form === c.code ? " sel" : "") + (c.ready ? "" : " soon")}
                onClick={() => c.ready && setForm(c.code)} style={{ "--fc": FORM_COLOR[cat] }}>
                <div className="s-formcard-code">{c.code}{!c.ready && <span className="s-soon">soon</span>}</div>
                <div className="s-formcard-name">{c.name}</div>
                <div className="s-formcard-sub">{c.sub}</div>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="s-step-lbl" style={{ marginTop: 8 }}>2 · Select the taxpayer</div>
      {taxpayers.length === 0 ? (
        <div className="s-inline-note">No taxpayers yet. <a onClick={() => setRoute({ view: "taxpayers" })}>Add a taxpayer →</a></div>
      ) : (
        <div className="s-tplist">
          {taxpayers.map((tp) => (
            <button key={tp.id} className={"s-tpcard" + (tpId === tp.id ? " sel" : "")} onClick={() => setTpId(tp.id)}>
              <div className={"s-tpavatar " + tp.kind}>{initials(Taxpayers.displayName(tp))}</div>
              <div className="s-tpcard-txt">
                <b>{Taxpayers.displayName(tp)}</b>
                <i>TIN {tp.tin || "—"} · {tp.kind === "individual" ? "Individual" : "Non-Individual"}</i>
              </div>
              {tpId === tp.id && <span className="s-tpcheck"><Icon d={SIco.check} size={15} /></span>}
            </button>
          ))}
        </div>
      )}

      <div className="s-step-actions">
        <button className="s-btn" onClick={() => setRoute({ view: "dashboard" })}>Cancel</button>
        <button className="s-btn s-btn-primary" disabled={!form || !tpId} onClick={() => newFiling(form, tpId)}>
          Generate Form<Icon d={SIco.chevR} size={16} />
        </button>
      </div>
    </div>
  );
}

window.BIRApp = BIRApp;
window.SIco = SIco; window.Icon = Icon; window.Mark = Mark;
window.timeAgo = timeAgo; window.initials = initials; window.FORM_COLOR = FORM_COLOR;

function timeAgo(ts) {
  if (!ts) return "—";
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  if (s < 604800) return Math.floor(s / 86400) + "d ago";
  return new Date(ts).toLocaleDateString();
}
function initials(name) {
  if (!name) return "?";
  const parts = name.replace(/,/g, "").trim().split(/\s+/);
  return ((parts[0] || "")[0] || "" + (parts[1] ? parts[1][0] : "")).toUpperCase().slice(0, 2) ||
    name.slice(0, 2).toUpperCase();
}

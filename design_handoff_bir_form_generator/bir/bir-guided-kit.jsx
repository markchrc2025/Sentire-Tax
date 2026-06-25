// bir-guided-kit.jsx — shared primitives + shell for all guided wizards
// Exports: GuidedShell, makeGuidedField helpers (via window.GKit)
const { useState: gkUseState } = React;

// Factory: given (data, set), returns a set of field components bound to that data.
function makeGuided(data, set) {
  const { num, roundPeso } = window.BIR;
  const is = (f, v) => data[f] === v;
  const pick = (f, v) => set(f, v);

  const Money = ({ field, value, ro }) => {
    if (ro) {
      return (
        <div className="g-money ro">
          <span className="peso">₱</span>
          <input value={window.BIR.fmtAmt(value == null ? 0 : value)} readOnly tabIndex={-1} />
        </div>
      );
    }
    return (
      <div className="g-money">
        <span className="peso">₱</span>
        <input inputMode="decimal" value={data[field] == null ? "" : data[field]} placeholder="0"
          onChange={(e) => set(field, e.target.value.replace(/[^0-9.\-]/g, ""))}
          onBlur={(e) => { const n = num(e.target.value); set(field, e.target.value.trim() === "" ? "" : String(roundPeso(n))); }} />
      </div>
    );
  };
  const Txt = ({ field, ph, up, maxw }) => (
    <input className={"g-text" + (up ? " up" : "")} style={maxw ? { maxWidth: maxw } : null}
      value={data[field] == null ? "" : data[field]} placeholder={ph || ""} onChange={(e) => set(field, e.target.value)} />
  );
  const YesNo = ({ field }) => (
    <div className="g-seg2">
      <button className={is(field, "yes") ? "on" : ""} onClick={() => pick(field, "yes")}>Yes</button>
      <button className={is(field, "no") ? "on" : ""} onClick={() => pick(field, "no")}>No</button>
    </div>
  );
  const Seg = ({ field, options }) => (
    <div className="g-seg2">
      {options.map((o) => (
        <button key={o.val} className={is(field, o.val) ? "on" : ""} onClick={() => pick(field, o.val)}>{o.label}</button>
      ))}
    </div>
  );
  const Cards = ({ field, options, cols }) => (
    <div className={"g-choice" + (cols === 2 ? " c2" : "")}>
      {options.map((o) => (
        <button key={o.val} className={"g-opt" + (is(field, o.val) ? " on" : "")} onClick={() => pick(field, o.val)}>
          <div className="g-opt-t">{o.code && <span className="g-opt-code">{o.code}</span>}{o.title}</div>
          {o.note && <div className="g-opt-note">{o.note}</div>}
          <span className="g-opt-check">{is(field, o.val) && <Icon d={SIco.check} size={12} />}</span>
        </button>
      ))}
    </div>
  );
  const Q = ({ item, label, help, req, children }) => (
    <div className="g-q">
      <label className="g-q-label">{item && <span className="g-q-item">{item} · </span>}{label}{req && <span className="req">*</span>}</label>
      {help && <p className="g-q-help">{help}</p>}
      {children}
    </div>
  );
  // a read-only summary strip of {label,value(₱)} rows; last row big
  const Result = ({ rows }) => (
    <div className="g-result hl">
      {rows.map((r, i) => (
        <div key={i} className={"g-result-row" + (r.big ? " big" : "")}>
          <span>{r.label}</span><b>{r.peso === false ? r.value : "₱ " + window.BIR.fmtAmt(r.value)}</b>
        </div>
      ))}
    </div>
  );
  const ReadOnly = ({ items }) => (
    <div className="g-readonly">
      <div className="g-readonly-h"><Icon d={SIco.check} size={13} />Auto-filled from taxpayer profile</div>
      <div className="g-ro-grid">
        {items.map((it, i) => <div className="g-ro-item" key={i}><i>{it.label}</i><b>{it.value || "—"}</b></div>)}
      </div>
    </div>
  );

  return { is, pick, Money, Txt, YesNo, Seg, Cards, Q, Result, ReadOnly };
}

// Shared shell: renders tabs, card, nav. `steps` = [{part,tab,title,desc,render}]
function GuidedShell({ steps, onViewForm, onPrint }) {
  const [step, setStep] = gkUseState(0);
  const cur = steps[step];
  const lastIdx = steps.length - 1;
  return (
    <div className="g-scroll">
      <div className="g-shell">
        <div className="g-tabs" role="tablist">
          {steps.map((s, i) => (
            <button key={i} role="tab" aria-selected={i === step}
              className={"g-tab" + (i === step ? " on" : i < step ? " done" : "")} onClick={() => setStep(i)}>
              <span className="g-tab-dot">{i < step ? <Icon d={SIco.check} size={10} /> : i + 1}</span>
              <span className="g-tab-lbl"><b>{s.part}</b><i>{s.tab}</i></span>
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
                <button className="s-btn s-btn-primary" onClick={onViewForm}><Icon d={SIco.file} size={16} />View official form</button>
                <button className="s-btn" onClick={onPrint}><Icon d={SIco.print} size={16} />Print / Save as PDF</button>
              </div>
            )}
          </div>
        </div>
        <div className="g-nav">
          <button className="s-btn" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))} style={step === 0 ? { opacity: .4, cursor: "not-allowed" } : null}>
            <Icon d={SIco.back} size={16} />Back
          </button>
          <span className="g-nav-mid">Step {step + 1} of {steps.length}</span>
          {step < lastIdx ? (
            <button className="s-btn s-btn-primary" onClick={() => setStep((s) => Math.min(lastIdx, s + 1))}>Next<Icon d={SIco.chevR} size={16} /></button>
          ) : (
            <button className="s-btn s-btn-primary" onClick={onViewForm}>Finish<Icon d={SIco.check} size={16} /></button>
          )}
        </div>
      </div>
    </div>
  );
}

// profile display-name helper
function gName(tp) {
  if (!tp) return "";
  return tp.kind === "individual" ? [tp.lastName, tp.firstName, tp.middleName].filter(Boolean).join(", ") : tp.regName;
}

Object.assign(window, { makeGuided, GuidedShell, gName });

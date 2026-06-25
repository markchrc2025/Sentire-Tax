// bir-shell2.jsx — Editor + Taxpayers views
// Uses globals from bir-shell.jsx (Icon, SIco, Mark, FORM_COLOR, initials, timeAgo)

/* ================= EDITOR ================= */
function Editor({ filingId, setRoute, refresh }) {
  const { Taxpayers, Filings, CATALOG } = window.BIR;
  const filing = Filings.get(filingId);
  const [data, setData] = useState(() => (filing ? { ...(filing.data || {}) } : {}));
  const [saved, setSaved] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [fit, setFit] = useState(true);
  const [mode, setMode] = useState("guided");
  const [xmlMsg, setXmlMsg] = useState(null);
  const stageRef = useRef(null);

  if (!filing) {
    return <div className="s-page"><button className="s-btn" onClick={() => setRoute({ view: "dashboard" })}><Icon d={SIco.back} size={16} />Back</button><p style={{ marginTop: 20 }}>Filing not found.</p></div>;
  }
  const tp = Taxpayers.get(filing.taxpayerId);
  const meta = CATALOG.find((c) => c.code === filing.form) || {};
  const comp = window.BIR.computeFor(filing.form, data);
  const guidedSupported = !!window.BIR.computeFor(filing.form, {});
  const guided = guidedSupported && mode === "guided";

  function set(field, val) {
    setData((d) => {
      const nd = { ...d, [field]: val };
      filing.data = nd;
      if (field === "year") filing.period = val;
      Filings.save(filing);
      return nd;
    });
    setSaved(false);
    clearTimeout(window.__bsave);
    window.__bsave = setTimeout(() => setSaved(true), 450);
  }

  // fit-to-width
  useEffect(() => {
    function recalc() {
      if (!fit || !stageRef.current) return;
      const avail = stageRef.current.clientWidth - 48;
      setZoom(Math.min(1, avail / 1044));
    }
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [fit]);

  function doPrint() {
    if (guided) { setMode("form"); setTimeout(() => window.print(), 250); return; }
    setTimeout(() => window.print(), 60);
  }

  function doXML() {
    if (filing.form !== "1701A") { alert("XML export is available for 1701A."); return; }
    const c = window.BIR.compute1701A(data);
    const r = window.BIRXML.exportFiling(filing, tp, c);
    refresh();
    setXmlMsg(r.filename);
    setTimeout(() => setXmlMsg(null), 3200);
  }

  const valid = filing.form === "1701A" ? validate1701A(data, comp) : [];

  return (
    <div className="s-editor">
      <div className="s-ebar">
        <button className="s-iconbtn lg" onClick={() => setRoute({ view: "dashboard" })} title="Back to filings"><Icon d={SIco.back} size={18} /></button>
        <span className="s-formchip lg" style={{ "--fc": FORM_COLOR[meta.cat] || "#6B6259" }}>{filing.form}</span>
        <div className="s-ebar-title">
          <b>{meta.name}</b>
          <i>{Taxpayers.displayName(tp)} · TIN {tp ? tp.tin : "—"}</i>
        </div>
        {guidedSupported && (
          <div className="g-mode">
            <button className={guided ? "on" : ""} onClick={() => setMode("guided")}><Icon d={SIco.users} size={14} />Guided</button>
            <button className={!guided ? "on" : ""} onClick={() => setMode("form")}><Icon d={SIco.file} size={14} />Form</button>
          </div>
        )}
        <span className={"s-savechip" + (saved ? " ok" : "")}>
          {saved ? <><Icon d={SIco.check} size={13} />Saved</> : "Saving…"}
        </span>
        {!guided && (
          <div className="s-zoom">
            <button className="s-iconbtn" onClick={() => { setFit(false); setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2))); }}><Icon d={SIco.zoomOut} size={15} /></button>
            <button className="s-zoom-val" onClick={() => setFit((f) => !f)}>{fit ? "Fit" : Math.round(zoom * 100) + "%"}</button>
            <button className="s-iconbtn" onClick={() => { setFit(false); setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(2))); }}><Icon d={SIco.zoomIn} size={15} /></button>
          </div>
        )}
        <button className="s-btn s-btn-xml" onClick={doXML} title="Export eBIRForms XML"><Icon d={SIco.code} size={16} />Export XML</button>
        <button className="s-btn s-btn-primary" onClick={doPrint}><Icon d={SIco.print} size={16} />Print / Save as PDF</button>
      </div>

      <div className="s-ebody" style={{ gridTemplateColumns: guided ? "1fr 268px" : "1fr" }}>
        {guided ? (
          renderGuided(filing.form, tp, data, set, comp, () => setMode("form"), doPrint)
        ) : (
          <div className="s-stage" ref={stageRef}>
            <div className="s-stage-inner" style={{ zoom: zoom }}>
              <div className="bir-doc">
                {renderForm(filing.form, tp, data, set, comp, meta)}
              </div>
            </div>
          </div>
        )}

        {guided && (
        <aside className="s-rail">
          <div className="s-rail-sec">
            <h4>Summary</h4>
            {comp ? (
              <div className="s-sum">
                {railSummary(filing.form, data, comp).map((r, i) => r.div
                  ? <div className="s-sum-div" key={i} />
                  : <SumRow key={i} big={r.big} lbl={r.lbl} val={r.val} neg={r.neg} />)}
              </div>
            ) : <p className="s-muted-sm">Computation appears here once the form supports it.</p>}
          </div>

          <div className="s-rail-sec">
            <h4>Checklist</h4>
            {valid.length === 0 ? (
              <div className="s-allgood"><Icon d={SIco.check} size={15} />Ready to print &amp; file.</div>
            ) : (
              <ul className="s-valid">
                {valid.map((v, i) => <li key={i} className={v.level}><Icon d={v.level === "warn" ? SIco.warn : SIco.check} size={13} />{v.msg}</li>)}
              </ul>
            )}
          </div>

          <div className="s-rail-sec">
            <h4>XML Exports <span className="s-rail-count">{(filing.exports || []).length}</span></h4>
            <button className="s-btn s-btn-xml full" onClick={doXML}><Icon d={SIco.code} size={14} />Generate eBIRForms XML</button>
            {(filing.exports || []).length === 0 ? (
              <p className="s-muted-sm" style={{ marginTop: 8 }}>No XML generated yet. Exports are saved here for reference.</p>
            ) : (
              <ul className="s-exports">
                {(filing.exports || []).map((x, i) => (
                  <li key={i}>
                    <div className="s-exp-info"><b title={x.filename}>{x.filename}</b><i>{timeAgo(x.at)}</i></div>
                    <button className="s-iconbtn" title="Download again" onClick={() => window.BIRXML.download(x.filename, x.xml)}><Icon d={SIco.download} size={14} /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="s-rail-sec">
            <h4>Taxpayer</h4>
            <div className="s-rail-tp">
              <div className={"s-tpavatar " + (tp ? tp.kind : "individual")}>{initials(Taxpayers.displayName(tp))}</div>
              <div><b>{Taxpayers.displayName(tp)}</b><i>{tp && tp.email}</i></div>
            </div>
            <button className="s-btn s-btn-ghost full" onClick={() => setRoute({ view: "taxpayers", editId: filing.taxpayerId })}>
              <Icon d={SIco.edit} size={14} />Edit taxpayer details
            </button>
          </div>
        </aside>
        )}
      </div>
      {xmlMsg && (
        <div className="s-toast">
          <Icon d={SIco.check} size={16} />
          <div><b>XML exported</b><span>{xmlMsg}</span></div>
        </div>
      )}
    </div>
  );
}

function SumRow({ lbl, val, big, neg }) {
  return <div className={"s-sum-row" + (big ? " big" : "")}><span>{lbl}</span><b className={neg ? "neg" : ""}>{val}</b></div>;
}

// form-aware rail summary rows: [{lbl,val,big,neg} | {div:true}]
function railSummary(form, data, comp) {
  const P = (n) => "₱ " + window.BIR.fmtAmt(n);
  switch (form) {
    case "1701A": return [
      { lbl: "Tax rate", val: data.taxRate === "eight" ? "8% flat" : "Graduated + OSD" },
      { lbl: "Taxable income", val: P(data.taxRate === "eight" ? comp.A.i55 : comp.A.i45) },
      { lbl: "Tax due", val: P(comp.A.i20) }, { lbl: "Tax credits", val: P(comp.A.i21) },
      { div: true }, { big: true, lbl: "Amount payable", val: P(comp.i30), neg: comp.i30 < 0 },
    ];
    case "1701": return [
      { lbl: "Tax rate", val: data.rateA === "eight" ? "8% + graduated" : "Graduated" },
      { lbl: "Taxable income", val: P(comp.A.taxableTotal) }, { lbl: "Tax due", val: P(comp.A.taxDue) },
      { lbl: "Tax credits", val: P(comp.A.credits) },
      { div: true }, { big: true, lbl: "Amount payable", val: P(comp.aggregate), neg: comp.aggregate < 0 },
    ];
    case "1701Q": return [
      { lbl: "Quarter", val: data.quarter || "—" }, { lbl: "Taxable income", val: P(comp.A.taxableCum) },
      { lbl: "Tax due", val: P(comp.A.taxDue) }, { lbl: "Credits", val: P(comp.A.credits) },
      { div: true }, { big: true, lbl: "Amount payable", val: P(comp.aggregate), neg: comp.aggregate < 0 },
    ];
    case "1702RT": return [
      { lbl: "Method", val: data.method === "osd" ? "OSD 40%" : "Itemized" },
      { lbl: "Net taxable income", val: P(comp.i39) },
      { lbl: "Normal tax", val: P(comp.i41) }, { lbl: "MCIT 2%", val: P(comp.i42) },
      { lbl: "Tax due", val: P(comp.i43) + (comp.mcitApplies ? " (MCIT)" : "") },
      { div: true }, { big: true, lbl: "Amount payable", val: P(comp.i21), neg: comp.i21 < 0 },
    ];
    case "1702Q": return [
      { lbl: "Quarter", val: data.quarter || "—" }, { lbl: "Taxable income", val: P(comp.s2_9) },
      { lbl: "Normal tax", val: P(comp.s2_11) }, { lbl: "MCIT 2%", val: P(comp.mcit) },
      { lbl: "Income tax due", val: P(comp.s2_13) + (comp.mcitApplies ? " (MCIT)" : "") },
      { div: true }, { big: true, lbl: "Amount payable", val: P(comp.i25), neg: comp.i25 < 0 },
    ];
    case "2550Q": return [
      { lbl: "VATable sales", val: P(comp.i31a) }, { lbl: "Output tax (12%)", val: P(comp.i34b) },
      { lbl: "Allowable input tax", val: P(comp.i60) },
      { div: true }, { big: true, lbl: "Total payable", val: P(comp.i26), neg: comp.i26 < 0 },
    ];
    case "2551Q": return [
      { lbl: "Total tax due", val: P(comp.i14) }, { lbl: "Credits", val: P(comp.i18) },
      { div: true }, { big: true, lbl: "Total payable", val: P(comp.i24), neg: comp.i24 < 0 },
    ];
    case "2307": return [
      { lbl: "Total income payments", val: P(comp.totalIncome) },
      { div: true }, { big: true, lbl: "Total tax withheld", val: P(comp.totalTax) },
    ];
    case "2316": return [
      { lbl: "Gross taxable income", val: P(comp.i23) }, { lbl: "Tax due", val: P(comp.i24) },
      { div: true }, { big: true, lbl: "Total taxes withheld", val: P(comp.i28) },
    ];
    default: return [];
  }
}
function renderGuided(form, tp, data, set, comp, onViewForm, onPrint) {
  const p = { tp, data, set, comp, onViewForm, onPrint };
  switch (form) {
    case "1701A": return <Guided1701A {...p} />;
    case "1701": return <Guided1701 {...p} />;
    case "1701Q": return <Guided1701Q {...p} />;
    case "1702RT": return <Guided1702RT {...p} />;
    case "1702Q": return <Guided1702Q {...p} />;
    case "2550Q": return <Guided2550Q {...p} />;
    case "2551Q": return <Guided2551Q {...p} />;
    case "2307": return <Guided2307 {...p} />;
    case "2316": return <Guided2316 {...p} />;
    default: return null;
  }
}

function renderForm(form, tp, data, set, comp, meta) {
  const p = { tp, data, set, comp };
  switch (form) {
    case "1701A": return <Form1701A {...p} />;
    case "1701": return <Form1701 {...p} />;
    case "1701Q": return <Form1701Q {...p} />;
    case "1702RT": return <Form1702RT {...p} />;
    case "1702Q": return <Form1702Q {...p} />;
    case "2550Q": return <Form2550Q {...p} />;
    case "2551Q": return <Form2551Q {...p} />;
    case "2307": return <Form2307 {...p} />;
    case "2316": return <Form2316 {...p} />;
    default: return <ComingSoon code={form} name={meta.name} />;
  }
}

function ComingSoon({ code, name }) {
  return (
    <div className="bir-sheet" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 60, minHeight: 600 }}>
      <div style={{ fontSize: 46, fontWeight: 700, color: "#A0627D", fontFamily: "Arial" }}>{code}</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginTop: 8, color: "#2A2420" }}>{name}</div>
      <p style={{ maxWidth: 380, color: "#6B6259", fontSize: 13, marginTop: 12, fontFamily: "var(--body)" }}>
        This form is queued for the next build pass. The flagship 1701A is fully wired — once you greenlight it, the rest follow the same faithful, auto-computed pattern.
      </p>
    </div>
  );
}

function validate1701A(d, comp) {
  const out = [];
  if (!d.year) out.push({ level: "warn", msg: "Enter the taxable year (Item 1)." });
  if (!d.taxRate) out.push({ level: "warn", msg: "Choose a tax rate (Item 19)." });
  if (!d.atc) out.push({ level: "warn", msg: "Select an ATC (Item 7)." });
  const sales = window.BIR.num(d.taxRate === "eight" ? d.i47A : d.i36A);
  if (!sales) out.push({ level: "warn", msg: "Enter sales/revenues in Part IV." });
  if (d.taxRate === "eight" && comp.A.i53 > 3000000) out.push({ level: "warn", msg: "8% rate unavailable — sales exceed ₱3M." });
  if (window.BIR.num(d.i23A) > comp.A.i20 * 0.5 + 1) out.push({ level: "warn", msg: "2nd installment (Item 23) can’t exceed 50% of tax due." });
  return out;
}

/* ================= TAXPAYERS ================= */
function TaxpayersView({ refresh, tick, route }) {
  const { Taxpayers } = window.BIR;
  const [edit, setEdit] = useState(() => (route && route.editId ? Taxpayers.get(route.editId) : null));
  const list = Taxpayers.all();

  return (
    <div className="s-page">
      <div className="s-head">
        <div><h1>Taxpayers</h1><p>Enter each filer’s details once — every form auto-fills its background information.</p></div>
        <button className="s-btn s-btn-primary" onClick={() => setEdit("new")}><Icon d={SIco.plus} size={16} />Add Taxpayer</button>
      </div>

      {list.length === 0 ? (
        <div className="s-empty">
          <div className="s-empty-mark"><Icon d={SIco.users} size={26} /></div>
          <h3>No taxpayers yet</h3>
          <p>Add an individual or a company to start generating forms.</p>
          <button className="s-btn s-btn-primary" onClick={() => setEdit("new")}><Icon d={SIco.plus} size={16} />Add Taxpayer</button>
        </div>
      ) : (
        <div className="s-tpgrid">
          {list.map((tp) => {
            const n = Taxpayers.forTaxpayer ? null : null;
            const count = window.BIR.Filings.forTaxpayer(tp.id).length;
            return (
              <div className="s-tptile" key={tp.id} onClick={() => setEdit(tp)}>
                <div className="s-tptile-top">
                  <div className={"s-tpavatar lg " + tp.kind}>{initials(Taxpayers.displayName(tp))}</div>
                  <span className={"s-kindtag " + tp.kind}>{tp.kind === "individual" ? "Individual" : "Non-Individual"}</span>
                </div>
                <b className="s-tptile-name">{Taxpayers.displayName(tp)}</b>
                <div className="s-tptile-meta">TIN {tp.tin || "—"}{tp.rdo ? " · RDO " + tp.rdo : ""}</div>
                <div className="s-tptile-meta">{[tp.city, tp.zip].filter(Boolean).join(" ")}</div>
                <div className="s-tptile-foot">{count} filing{count === 1 ? "" : "s"}</div>
              </div>
            );
          })}
        </div>
      )}

      {edit && <TaxpayerEditor tp={edit === "new" ? null : edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); refresh(); }} onDelete={(id) => { window.BIR.Taxpayers.remove(id); setEdit(null); refresh(); }} />}
    </div>
  );
}

function TaxpayerEditor({ tp, onClose, onSaved, onDelete }) {
  const { Taxpayers } = window.BIR;
  const [f, setF] = useState(() => tp ? { ...tp } : {
    kind: "individual", regName: "", lastName: "", firstName: "", middleName: "",
    tin: "", branch: "00000", rdo: "", address: "", city: "", zip: "",
    birthdate: "", incorpDate: "", email: "", phone: "", citizenship: "Filipino",
    civilStatus: "", taxpayerType: "", classification: "Small",
  });
  const upd = (k, v) => setF((o) => ({ ...o, [k]: v }));
  function save() {
    if (f.kind === "individual" && !f.lastName) { alert("Enter the last name."); return; }
    if (f.kind === "non-individual" && !f.regName) { alert("Enter the registered name."); return; }
    Taxpayers.save(f); onSaved();
  }

  return (
    <div className="s-modal-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="s-modal">
        <div className="s-modal-head">
          <h3>{tp ? "Edit Taxpayer" : "Add Taxpayer"}</h3>
          <button className="s-iconbtn" onClick={onClose}><Icon d={SIco.x} size={17} /></button>
        </div>
        <div className="s-modal-body">
          <div className="s-seg">
            <button className={f.kind === "individual" ? "on" : ""} onClick={() => upd("kind", "individual")}>Individual</button>
            <button className={f.kind === "non-individual" ? "on" : ""} onClick={() => upd("kind", "non-individual")}>Non-Individual (Company)</button>
          </div>

          {f.kind === "individual" ? (
            <div className="s-grid3">
              <Field lbl="Last Name" v={f.lastName} on={(v) => upd("lastName", v)} up />
              <Field lbl="First Name" v={f.firstName} on={(v) => upd("firstName", v)} up />
              <Field lbl="Middle Name" v={f.middleName} on={(v) => upd("middleName", v)} up />
            </div>
          ) : (
            <Field lbl="Registered Name" v={f.regName} on={(v) => upd("regName", v)} up />
          )}

          <div className="s-grid3">
            <Field lbl="TIN" v={f.tin} on={(v) => upd("tin", v)} placeholder="000-000-000" />
            <Field lbl="Branch Code" v={f.branch} on={(v) => upd("branch", v)} placeholder="00000" />
            <Field lbl="RDO Code" v={f.rdo} on={(v) => upd("rdo", v)} placeholder="050" />
          </div>

          <Field lbl="Registered Address" v={f.address} on={(v) => upd("address", v)} up />
          <div className="s-grid3">
            <Field lbl="City / Municipality" v={f.city} on={(v) => upd("city", v)} up />
            <Field lbl="ZIP Code" v={f.zip} on={(v) => upd("zip", v)} />
            <Field lbl="Classification" v={f.classification} on={(v) => upd("classification", v)} type="select" opts={["Micro", "Small", "Medium", "Large"]} />
          </div>
          <div className="s-grid3">
            <Field lbl="Email" v={f.email} on={(v) => upd("email", v)} />
            <Field lbl="Contact Number" v={f.phone} on={(v) => upd("phone", v)} />
            <Field lbl="Citizenship" v={f.citizenship} on={(v) => upd("citizenship", v)} up />
          </div>
          {f.kind === "individual" ? (
            <div className="s-grid3">
              <Field lbl="Date of Birth" v={f.birthdate} on={(v) => upd("birthdate", v)} type="date" />
              <Field lbl="Civil Status" v={f.civilStatus} on={(v) => upd("civilStatus", v)} type="select" opts={["", "Single", "Married", "Legally Separated", "Widow/er"]} />
              <Field lbl="Taxpayer Type" v={f.taxpayerType} on={(v) => upd("taxpayerType", v)} type="select" opts={["", "Single Proprietor", "Professional"]} />
            </div>
          ) : (
            <div className="s-grid3">
              <Field lbl="Date of Incorporation" v={f.incorpDate} on={(v) => upd("incorpDate", v)} type="date" />
            </div>
          )}
        </div>
        <div className="s-modal-foot">
          {tp ? <button className="s-btn s-btn-danger" onClick={() => { if (confirm("Delete this taxpayer and all its filings?")) onDelete(tp.id); }}><Icon d={SIco.trash} size={15} />Delete</button> : <span />}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="s-btn" onClick={onClose}>Cancel</button>
            <button className="s-btn s-btn-primary" onClick={save}>Save Taxpayer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ lbl, v, on, placeholder, up, type, opts }) {
  return (
    <label className="s-field">
      <span>{lbl}</span>
      {type === "select" ? (
        <select value={v || ""} onChange={(e) => on(e.target.value)}>
          {opts.map((o) => <option key={o} value={o}>{o || "—"}</option>)}
        </select>
      ) : (
        <input type={type === "date" ? "date" : "text"} value={v || ""} placeholder={placeholder || ""}
          onChange={(e) => on(e.target.value)} style={up ? { textTransform: "uppercase" } : null} />
      )}
    </label>
  );
}

Object.assign(window, { Editor, TaxpayersView, TaxpayerEditor, Field, validate1701A });

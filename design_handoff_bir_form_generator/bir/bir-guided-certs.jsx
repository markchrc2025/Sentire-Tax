// bir-guided-certs.jsx — guided wizards for 2307 and 2316
// Exports: Guided2307, Guided2316

/* ============ 2307 — Certificate of Creditable Tax Withheld ============ */
function Guided2307({ tp, data, set, comp, onViewForm, onPrint }) {
  const F = makeGuided(data, set);
  const name = gName(tp);
  const rows = data.rows || [{}, {}, {}, {}];
  function setRow(i, key, val) {
    const r = (data.rows || [{}, {}, {}, {}]).map((x) => ({ ...x }));
    while (r.length <= i) r.push({});
    r[i][key] = val; set("rows", r);
  }
  const steps = [
    {
      part: "Period", tab: "Period", title: "Certificate period",
      desc: "This certificate covers a quarter of income payments. The payee (you/your taxpayer) is auto-filled.",
      render: () => (
        <>
          <F.ReadOnly items={[
            { label: "Payee", value: name }, { label: "TIN", value: tp && tp.tin },
            { label: "Address", value: tp ? [tp.address, tp.city].filter(Boolean).join(", ") : "" }, { label: "ZIP", value: tp && tp.zip },
          ]} />
          <F.Q item="Item 1" label="Period — From (MM/DD/YYYY)" req><F.Txt field="periodFrom" ph="01/01/2024" maxw={180} /></F.Q>
          <F.Q label="Period — To (MM/DD/YYYY)" req><F.Txt field="periodTo" ph="03/31/2024" maxw={180} /></F.Q>
        </>
      ),
    },
    {
      part: "Part II", tab: "Payor", title: "Payor information",
      desc: "Who made the income payments and withheld the tax (your client/customer).",
      render: () => (
        <>
          <F.Q item="Item 7" label="Payor’s Name" req><F.Txt field="payorName" up /></F.Q>
          <F.Q item="Item 6" label="Payor’s TIN"><F.Txt field="payorTin" ph="000-000-000-000" maxw={220} /></F.Q>
          <F.Q item="Item 8" label="Payor’s Registered Address"><F.Txt field="payorAddr" up /></F.Q>
        </>
      ),
    },
    {
      part: "Part III", tab: "Income", title: "Income payments & taxes withheld",
      desc: "Enter each income payment by month of the quarter. The quarter total and tax withheld are summed automatically.",
      render: () => (
        <>
          {rows.map((r, i) => (
            <div className="g-q" key={i}>
              <label className="g-q-label"><span className="g-q-item">Line {i + 1}</span></label>
              <input className="g-text" style={{ marginBottom: 8 }} placeholder="Nature of income payment"
                value={r.desc || ""} onChange={(e) => setRow(i, "desc", e.target.value)} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, maxWidth: 460 }}>
                {[["m1", "1st month ₱"], ["m2", "2nd month ₱"], ["m3", "3rd month ₱"], ["tax", "Tax withheld ₱"]].map(([k, lbl]) => (
                  <div key={k}>
                    <div className="g-pair-h">{lbl}</div>
                    <div className="g-money"><span className="peso">₱</span>
                      <input inputMode="decimal" value={r[k] == null ? "" : r[k]} placeholder="0"
                        onChange={(e) => setRow(i, k, e.target.value.replace(/[^0-9.]/g, ""))} /></div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Line total: ₱ {window.BIR.fmtAmt(comp.rows[i] ? comp.rows[i].total : 0)}</div>
            </div>
          ))}
          <F.Result rows={[
            { label: "Total income payments", value: comp.totalIncome },
            { label: "Total tax withheld", value: comp.totalTax, big: true },
          ]} />
        </>
      ),
    },
    {
      part: "Review", tab: "Review", title: "Review & generate",
      desc: "Summary of this 2307 certificate. Open the official form to print or save as PDF.",
      render: () => (
        <F.Result rows={[
          { label: "Payee", value: name, peso: false },
          { label: "Payor", value: data.payorName || "—", peso: false },
          { label: "Period", value: (data.periodFrom || "—") + " to " + (data.periodTo || "—"), peso: false },
          { label: "Total income payments", value: comp.totalIncome },
          { label: "Total tax withheld", value: comp.totalTax, big: true },
        ]} />
      ),
    },
  ];
  return <GuidedShell steps={steps} onViewForm={onViewForm} onPrint={onPrint} />;
}

/* ============ 2316 — Certificate of Compensation ============ */
function Guided2316({ tp, data, set, comp, onViewForm, onPrint }) {
  const F = makeGuided(data, set);
  const name = gName(tp);
  const steps = [
    {
      part: "Part I", tab: "Employee", title: "Employee & period",
      desc: "This certificate reports an employee's compensation and tax withheld. Employee details come from the profile.",
      render: () => (
        <>
          <F.ReadOnly items={[
            { label: "Employee", value: name }, { label: "TIN", value: tp && tp.tin },
            { label: "RDO Code", value: tp && tp.rdo }, { label: "Address", value: tp ? [tp.address, tp.city].filter(Boolean).join(", ") : "" },
          ]} />
          <F.Q item="Item 1" label="For the Year (YYYY)" req><F.Txt field="year" ph="2024" maxw={140} /></F.Q>
          <F.Q item="Item 2" label="Period — From (MM/DD)"><F.Txt field="from" ph="01/01" maxw={140} /></F.Q>
          <F.Q label="Period — To (MM/DD)"><F.Txt field="to" ph="12/31" maxw={140} /></F.Q>
        </>
      ),
    },
    {
      part: "Part II", tab: "Employer", title: "Employer information",
      desc: "Details of the present employer issuing this certificate.",
      render: () => (
        <>
          <F.Q item="Item 13" label="Employer’s Name" req><F.Txt field="empName" up /></F.Q>
          <F.Q item="Item 12" label="Employer’s TIN"><F.Txt field="empTin" ph="000-000-000-000" maxw={220} /></F.Q>
          <F.Q item="Item 14" label="Employer’s Registered Address"><F.Txt field="empAddr" up /></F.Q>
        </>
      ),
    },
    {
      part: "Part IV-B", tab: "Non-taxable", title: "Non-taxable / exempt compensation",
      desc: "Mandatory contributions, the ₱90,000 13th-month cap, de minimis benefits, and MWE pay are exempt.",
      render: () => (
        <>
          <F.Q label="Basic Salary (incl. exempt ₱250,000 & below / SMW)"><F.Money field="i29" /></F.Q>
          <F.Q label="13th Month Pay & Other Benefits (max ₱90,000)"><F.Money field="i34" /></F.Q>
          <F.Q label="De Minimis Benefits"><F.Money field="i35" /></F.Q>
          <F.Q label="SSS, GSIS, PHIC, Pag-IBIG & Union Dues"><F.Money field="i36" /></F.Q>
          <F.Q label="Salaries & Other Forms of Compensation"><F.Money field="i37" /></F.Q>
          <F.Result rows={[{ label: "Total non-taxable / exempt (Item 38)", value: comp.i38, big: true }]} />
        </>
      ),
    },
    {
      part: "Part IV-B", tab: "Taxable", title: "Taxable compensation",
      desc: "Regular taxable pay components. We total these and compute the tax due using the graduated table.",
      render: () => (
        <>
          <F.Q label="Basic Salary"><F.Money field="i39" /></F.Q>
          <F.Q label="Representation"><F.Money field="i40" /></F.Q>
          <F.Q label="Transportation"><F.Money field="i41" /></F.Q>
          <F.Q label="Cost of Living Allowance (COLA)"><F.Money field="i42" /></F.Q>
          <F.Q label="Taxable 13th Month & Other Benefits"><F.Money field="i50" /></F.Q>
          <F.Q label="Others / Supplementary"><F.Money field="i51" /></F.Q>
          <F.Result rows={[
            { label: "Total taxable compensation (Item 26)", value: comp.i26 },
            { label: "Gross taxable income (Item 23)", value: comp.i23 },
            { label: "Tax due (Item 24)", value: comp.i24, big: true },
          ]} />
        </>
      ),
    },
    {
      part: "Part IV-A", tab: "Withheld", title: "Taxes withheld",
      desc: "Tax actually withheld from the employee. We compare it to tax due to show any balance.",
      render: () => (
        <>
          <F.Q item="Item 22" label="Add: Taxable Compensation from Previous Employer"><F.Money field="i22" /></F.Q>
          <F.Q item="Item 25A" label="Taxes Withheld — Present Employer"><F.Money field="i25A" /></F.Q>
          <F.Q item="Item 25B" label="Taxes Withheld — Previous Employer"><F.Money field="i25B" /></F.Q>
          <F.Result rows={[
            { label: "Tax due", value: comp.i24 },
            { label: "Total taxes withheld (Item 28)", value: comp.i28 },
            { label: comp.i24 > comp.i28 ? "Tax still due" : "Over-withheld / refund", value: Math.abs(comp.i24 - comp.i28), big: true },
          ]} />
        </>
      ),
    },
    {
      part: "Review", tab: "Review", title: "Review & generate",
      desc: "Summary of this 2316 certificate. Open the official form to print or save as PDF.",
      render: () => (
        <F.Result rows={[
          { label: "Employee", value: name, peso: false },
          { label: "Employer", value: data.empName || "—", peso: false },
          { label: "Year", value: data.year || "—", peso: false },
          { label: "Gross taxable income", value: comp.i23 },
          { label: "Tax due", value: comp.i24 },
          { label: "Total taxes withheld", value: comp.i28, big: true },
        ]} />
      ),
    },
  ];
  return <GuidedShell steps={steps} onViewForm={onViewForm} onPrint={onPrint} />;
}

Object.assign(window, { Guided2307, Guided2316 });

// bir-guided-returns.jsx — guided wizards for 1701, 1701Q, 2550Q, 2551Q
// Exports: Guided1701, Guided1701Q, Guided2550Q, Guided2551Q

/* ============ 1701 — Annual ITR (mixed income) ============ */
function Guided1701({ tp, data, set, comp, onViewForm, onPrint }) {
  const F = makeGuided(data, set);
  const name = gName(tp);
  const A = comp.A;
  const steps = [
    {
      part: "Part I", tab: "Details", title: "Filing details",
      desc: "Which annual return is this? Your identity details come from the taxpayer profile.",
      render: () => (
        <>
          <F.ReadOnly items={[
            { label: "Taxpayer", value: name }, { label: "TIN", value: tp && tp.tin },
            { label: "RDO Code", value: tp && tp.rdo }, { label: "Address", value: tp ? [tp.address, tp.city, tp.zip].filter(Boolean).join(", ") : "" },
          ]} />
          <F.Q item="Item 1" label="For the Year" help="Taxable year covered (e.g. 2024)." req><F.Txt field="year" ph="2024" maxw={140} /></F.Q>
          <F.Q item="Item 2" label="Is this an Amended Return?"><F.YesNo field="amended" /></F.Q>
          <F.Q item="Item 8" label="Taxpayer Type" req>
            <F.Cards field="taxpayerType" cols={2} options={[
              { val: "comp_biz", title: "Mixed Income", note: "Compensation + business/profession." },
              { val: "biz", title: "Business/Profession only" },
              { val: "estate", title: "Estate" }, { val: "trust", title: "Trust" },
            ]} />
          </F.Q>
        </>
      ),
    },
    {
      part: "Part I", tab: "Tax rate", title: "Tax rate & deduction method",
      desc: "How is your business income taxed? This drives the computation.",
      render: () => (
        <>
          <F.Q item="Item 19" label="Tax rate" req>
            <F.Cards field="rateA" options={[
              { val: "graduated", title: "Graduated rates", note: "Progressive 0%–35% on combined taxable income." },
              { val: "eight", title: "8% flat on business income", note: "8% on gross sales/receipts (≤₱3M), plus graduated on compensation." },
            ]} />
          </F.Q>
          {data.rateA !== "eight" && (
            <F.Q label="Method of deduction">
              <F.Cards field="methodA" cols={2} options={[
                { val: "itemized", title: "Itemized Deduction", note: "Actual business expenses." },
                { val: "osd", title: "OSD (40%)", note: "40% of net sales, no receipts needed." },
              ]} />
            </F.Q>
          )}
        </>
      ),
    },
    {
      part: "Part VI", tab: "Income", title: "Income",
      desc: "Enter your compensation income and business figures. We compute net business income and tax due.",
      render: () => (
        <>
          <F.Q label="Taxable Compensation Income (from BIR Form 2316)" help="Your taxable salary, if employed."><F.Money field="compA" /></F.Q>
          <F.Q label="Sales / Revenues / Receipts / Fees" req><F.Money field="salesA" /></F.Q>
          <F.Q label="Less: Sales Returns, Allowances & Discounts"><F.Money field="returnsA" /></F.Q>
          <F.Q label="Less: Cost of Sales/Services"><F.Money field="cogsA" /></F.Q>
          {data.rateA !== "eight" && data.methodA === "itemized" &&
            <F.Q label="Allowable Itemized Deductions"><F.Money field="deductA" /></F.Q>}
          <F.Q label="Add: Other Taxable / Non-Operating Income"><F.Money field="otherA" /></F.Q>
          <F.Result rows={[
            { label: "Net business income", value: A.netBizTotal },
            { label: "Total taxable income", value: A.taxableTotal },
            { label: "Tax due", value: A.taxDue, big: true },
          ]} />
        </>
      ),
    },
    {
      part: "Part VI", tab: "Credits", title: "Tax credits & payments",
      desc: "Taxes already paid or withheld reduce what you owe. Leave blank if none.",
      render: () => (
        <>
          <F.Q label="Prior Year’s Excess Credits"><F.Money field="excessA" /></F.Q>
          <F.Q label="Tax Payments for the First Three Quarters (1701Q)"><F.Money field="prevPaidA" /></F.Q>
          <F.Q label="Creditable Tax Withheld per BIR Form 2307"><F.Money field="cwtA" /></F.Q>
          <F.Q label="Tax Withheld on Compensation per BIR Form 2316"><F.Money field="compCwtA" /></F.Q>
          <F.Result rows={[{ label: "Total tax credits", value: A.credits }, { label: "Net tax payable", value: A.payable, big: true }]} />
        </>
      ),
    },
    {
      part: "Part II", tab: "Payable", title: "Penalties & amount payable",
      desc: "Add penalties only if filing late. Optionally defer part to a 2nd installment.",
      render: () => (
        <>
          <F.Q item="Item 23" label="Portion allowed for 2nd installment" help="Up to 50% of tax due may be deferred to October 15."><F.Money field="installA" /></F.Q>
          <F.Q label="Surcharge"><F.Money field="penA" /></F.Q>
          <F.Result rows={[
            { label: "Tax due", value: A.taxDue }, { label: "Less credits", value: A.credits },
            { label: comp.aggregate < 0 ? "Overpayment" : "Amount payable", value: comp.aggregate, big: true },
          ]} />
        </>
      ),
    },
    {
      part: "Review", tab: "Review", title: "Review & generate",
      desc: "Summary of your 1701. Open the official form to print or save as PDF.",
      render: () => (
        <F.Result rows={[
          { label: "Taxpayer", value: name, peso: false },
          { label: "Year · Rate", value: (data.year || "—") + " · " + (data.rateA === "eight" ? "8% + graduated" : "Graduated"), peso: false },
          { label: "Tax due", value: comp.A.taxDue + comp.B.taxDue },
          { label: comp.aggregate < 0 ? "Overpayment" : "Amount payable", value: comp.aggregate, big: true },
        ]} />
      ),
    },
  ];
  return <GuidedShell steps={steps} onViewForm={onViewForm} onPrint={onPrint} />;
}

/* ============ 1701Q — Quarterly ITR ============ */
function Guided1701Q({ tp, data, set, comp, onViewForm, onPrint }) {
  const F = makeGuided(data, set);
  const name = gName(tp);
  const A = comp.A;
  const steps = [
    {
      part: "Part I", tab: "Details", title: "Filing details",
      desc: "Which quarter is this return for? Identity details come from the profile.",
      render: () => (
        <>
          <F.ReadOnly items={[
            { label: "Taxpayer", value: name }, { label: "TIN", value: tp && tp.tin },
            { label: "RDO Code", value: tp && tp.rdo }, { label: "Address", value: tp ? [tp.address, tp.city].filter(Boolean).join(", ") : "" },
          ]} />
          <F.Q item="Item 1" label="For the Year" req><F.Txt field="year" ph="2024" maxw={140} /></F.Q>
          <F.Q item="Item 2" label="Quarter" req>
            <F.Cards field="quarter" cols={2} options={[
              { val: "1st", title: "1st Quarter" }, { val: "2nd", title: "2nd Quarter" }, { val: "3rd", title: "3rd Quarter" },
            ]} />
          </F.Q>
          <F.Q item="Item 7" label="Taxpayer/Filer Type" req>
            <F.Cards field="filerType" cols={2} options={[
              { val: "single", title: "Single Proprietor" }, { val: "prof", title: "Professional" },
              { val: "estate", title: "Estate" }, { val: "trust", title: "Trust" },
            ]} />
          </F.Q>
        </>
      ),
    },
    {
      part: "Part I", tab: "Tax rate", title: "Tax rate & method",
      desc: "Choose how this quarter's income is taxed (irrevocable for the year).",
      render: () => (
        <>
          <F.Q item="Item 16" label="Tax rate" req>
            <F.Cards field="rateA" options={[
              { val: "graduated", title: "Graduated rates per Tax Table" },
              { val: "eight", title: "8% on gross sales/receipts", note: "In lieu of graduated + percentage tax (≤₱3M)." },
            ]} />
          </F.Q>
          {data.rateA !== "eight" && (
            <F.Q label="Method of deduction">
              <F.Cards field="methodA" cols={2} options={[
                { val: "itemized", title: "Itemized Deduction" }, { val: "osd", title: "OSD (40%)" },
              ]} />
            </F.Q>
          )}
        </>
      ),
    },
    {
      part: "Part V", tab: "Income", title: "Income this quarter",
      desc: "Enter cumulative figures to date. We apply the 40% OSD (or your itemized amount) and the tax table.",
      render: () => (
        <>
          <F.Q label="Sales / Revenues / Receipts / Fees" req><F.Money field="salesA" /></F.Q>
          <F.Q label="Less: Sales Returns, Allowances & Discounts"><F.Money field="returnsA" /></F.Q>
          <F.Q label="Less: Cost of Sales/Services"><F.Money field="cogsA" /></F.Q>
          {data.rateA !== "eight" && data.methodA === "itemized" &&
            <F.Q label="Allowable Itemized Deductions"><F.Money field="deductA" /></F.Q>}
          <F.Q label="Add: Other Taxable Income / Non-Operating"><F.Money field="otherA" /></F.Q>
          <F.Q label="Add: Taxable Income from Previous Quarter(s)"><F.Money field="prevTaxableA" /></F.Q>
          <F.Result rows={[
            { label: "Net income", value: A.netIncome },
            { label: "Total taxable income to date", value: A.taxableCum },
            { label: "Tax due", value: A.taxDue, big: true },
          ]} />
        </>
      ),
    },
    {
      part: "Part V", tab: "Credits", title: "Tax credits & payments",
      desc: "Prior payments and withheld taxes reduce what you owe this quarter.",
      render: () => (
        <>
          <F.Q label="Prior Year’s Excess Credits"><F.Money field="excessA" /></F.Q>
          <F.Q label="Tax Payment(s) for Previous Quarter(s)"><F.Money field="prevPaidA" /></F.Q>
          <F.Q label="Creditable Tax Withheld per BIR Form 2307"><F.Money field="cwtA" /></F.Q>
          <F.Result rows={[{ label: "Total credits", value: A.credits }, { label: "Tax payable", value: A.payable, big: true }]} />
        </>
      ),
    },
    {
      part: "Review", tab: "Review", title: "Review & generate",
      desc: "Summary of your 1701Q. Open the official form to print or save as PDF.",
      render: () => (
        <F.Result rows={[
          { label: "Taxpayer", value: name, peso: false },
          { label: "Year · Quarter", value: (data.year || "—") + " · " + (data.quarter || "—"), peso: false },
          { label: "Tax due", value: A.taxDue },
          { label: comp.aggregate < 0 ? "Overpayment" : "Amount payable", value: comp.aggregate, big: true },
        ]} />
      ),
    },
  ];
  return <GuidedShell steps={steps} onViewForm={onViewForm} onPrint={onPrint} />;
}

/* ============ 2550Q — Quarterly VAT ============ */
function Guided2550Q({ tp, data, set, comp, onViewForm, onPrint }) {
  const F = makeGuided(data, set);
  const name = gName(tp);
  const steps = [
    {
      part: "Part I", tab: "Details", title: "Filing details",
      desc: "Which VAT quarter is this? Identity details come from the profile.",
      render: () => (
        <>
          <F.ReadOnly items={[
            { label: "Taxpayer", value: name }, { label: "TIN", value: tp && tp.tin },
            { label: "RDO Code", value: tp && tp.rdo }, { label: "Classification", value: (data.classification || (tp && tp.classification)) },
          ]} />
          <F.Q item="Item 2" label="Year Ended (MM/YYYY)" req><F.Txt field="year" ph="2024" maxw={140} /></F.Q>
          <F.Q item="Item 3" label="Quarter" req>
            <F.Cards field="quarter" cols={2} options={[
              { val: "1st", title: "1st Quarter" }, { val: "2nd", title: "2nd Quarter" },
              { val: "3rd", title: "3rd Quarter" }, { val: "4th", title: "4th Quarter" },
            ]} />
          </F.Q>
          <F.Q item="Item 5" label="Is this an Amended Return?"><F.YesNo field="amended" /></F.Q>
        </>
      ),
    },
    {
      part: "Part IV", tab: "Sales", title: "Sales & output tax",
      desc: "Enter your sales for the quarter. Output VAT is computed at 12% of VATable sales.",
      render: () => (
        <>
          <F.Q item="Item 31" label="VATable Sales (exclusive of VAT)" req><F.Money field="i31a" /></F.Q>
          <F.Q item="Item 32" label="Zero-Rated Sales"><F.Money field="i32a" /></F.Q>
          <F.Q item="Item 33" label="Exempt Sales"><F.Money field="i33a" /></F.Q>
          <F.Result rows={[
            { label: "Total sales", value: comp.i34a },
            { label: "Output tax (12%)", value: comp.i31b, big: true },
          ]} />
        </>
      ),
    },
    {
      part: "Part IV", tab: "Input tax", title: "Input tax (purchases)",
      desc: "Enter the VAT on your purchases — this credits against your output tax.",
      render: () => (
        <>
          <F.Q item="Item 38" label="Input Tax Carried Over from Previous Quarter"><F.Money field="i38" /></F.Q>
          <F.Q item="Item 44B" label="Input Tax on Domestic Purchases (this quarter)"><F.Money field="i44b" /></F.Q>
          <F.Q item="Item 46B" label="Input Tax on Importations"><F.Money field="i46b" /></F.Q>
          <F.Result rows={[
            { label: "Total available input tax", value: comp.i51 },
            { label: "Net VAT payable", value: comp.i61, big: true },
          ]} />
        </>
      ),
    },
    {
      part: "Part II", tab: "Payable", title: "Credits, penalties & total",
      desc: "Apply any VAT withheld/advance payments and penalties.",
      render: () => (
        <>
          <F.Q item="Item 16" label="Creditable VAT Withheld"><F.Money field="i16" /></F.Q>
          <F.Q item="Item 17" label="Advance VAT Payments"><F.Money field="i17" /></F.Q>
          <F.Q label="Surcharge"><F.Money field="i22" /></F.Q>
          <F.Q label="Interest"><F.Money field="i23" /></F.Q>
          <F.Result rows={[
            { label: "Net VAT payable", value: comp.i15 }, { label: "Less credits", value: comp.i20 },
            { label: comp.i26 < 0 ? "Excess credits" : "Total amount payable", value: comp.i26, big: true },
          ]} />
        </>
      ),
    },
    {
      part: "Review", tab: "Review", title: "Review & generate",
      desc: "Summary of your 2550Q. Open the official form to print or save as PDF.",
      render: () => (
        <F.Result rows={[
          { label: "Taxpayer", value: name, peso: false },
          { label: "Year · Quarter", value: (data.year || "—") + " · " + (data.quarter || "—"), peso: false },
          { label: "Output tax", value: comp.i34b }, { label: "Allowable input tax", value: comp.i60 },
          { label: comp.i26 < 0 ? "Excess credits" : "Total payable", value: comp.i26, big: true },
        ]} />
      ),
    },
  ];
  return <GuidedShell steps={steps} onViewForm={onViewForm} onPrint={onPrint} />;
}

/* ============ 2551Q — Quarterly Percentage Tax ============ */
function Guided2551Q({ tp, data, set, comp, onViewForm, onPrint }) {
  const F = makeGuided(data, set);
  const name = gName(tp);
  const rows = data.rows || [{}, {}, {}, {}, {}, {}];
  const ATC = [
    ["PT010", "Persons exempt from VAT (Sec. 116)", "3"],
    ["PT040", "Domestic carriers & keepers of garages", "3"],
    ["PT041", "International Carriers", "3"],
    ["PT060", "Franchises on gas & water utilities", "2"],
    ["PT070", "Franchises on radio/TV broadcasting (≤P10M)", "3"],
    ["PT090", "Overseas dispatch/message from PH", "10"],
    ["PT120", "Life Insurance Premiums", "2"],
    ["PT130", "Agents of Foreign Insurance Cos.", "4"],
  ];
  function setRow(i, key, val) {
    const r = (data.rows || [{}, {}, {}, {}, {}, {}]).map((x) => ({ ...x }));
    while (r.length <= i) r.push({});
    r[i][key] = val; set("rows", r);
  }
  const steps = [
    {
      part: "Part I", tab: "Details", title: "Filing details",
      desc: "Which quarter is this percentage-tax return for?",
      render: () => (
        <>
          <F.ReadOnly items={[
            { label: "Taxpayer", value: name }, { label: "TIN", value: tp && tp.tin },
            { label: "RDO Code", value: tp && tp.rdo }, { label: "Address", value: tp ? [tp.address, tp.city].filter(Boolean).join(", ") : "" },
          ]} />
          <F.Q item="Item 2" label="Year Ended (MM/YYYY)" req><F.Txt field="year" ph="2024" maxw={140} /></F.Q>
          <F.Q item="Item 3" label="Quarter" req>
            <F.Cards field="quarter" cols={2} options={[
              { val: "1st", title: "1st Quarter" }, { val: "2nd", title: "2nd Quarter" },
              { val: "3rd", title: "3rd Quarter" }, { val: "4th", title: "4th Quarter" },
            ]} />
          </F.Q>
          <F.Q item="Item 4" label="Is this an Amended Return?"><F.YesNo field="amended" /></F.Q>
        </>
      ),
    },
    {
      part: "Schedule 1", tab: "Tax base", title: "Taxable amount & rate",
      desc: "Pick the percentage-tax type (ATC) and enter your taxable sales/receipts. The rate auto-fills and tax is computed.",
      render: () => (
        <>
          {rows.slice(0, 3).map((r, i) => (
            <div className="g-q" key={i}>
              <label className="g-q-label"><span className="g-q-item">Line {i + 1} · </span>Percentage tax type & taxable amount</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <select className="g-text" style={{ maxWidth: 320 }} value={r.atc || ""}
                  onChange={(e) => { const f = ATC.find((a) => a[0] === e.target.value); setRow(i, "atc", e.target.value); if (f) setRow(i, "rate", f[2]); }}>
                  <option value="">— select type —</option>
                  {ATC.map((a) => <option key={a[0]} value={a[0]}>{a[0]} · {a[1]} ({a[2]}%)</option>)}
                </select>
                <div className="g-money" style={{ maxWidth: 200 }}>
                  <span className="peso">₱</span>
                  <input inputMode="decimal" value={r.taxable == null ? "" : r.taxable} placeholder="0"
                    onChange={(e) => setRow(i, "taxable", e.target.value.replace(/[^0-9.]/g, ""))} />
                </div>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>{r.rate ? r.rate + "%" : ""}</span>
              </div>
            </div>
          ))}
          <F.Result rows={[{ label: "Total tax due", value: comp.i14, big: true }]} />
        </>
      ),
    },
    {
      part: "Part II", tab: "Payable", title: "Credits, penalties & total",
      desc: "Apply any creditable percentage tax withheld and penalties.",
      render: () => (
        <>
          <F.Q item="Item 15" label="Creditable Percentage Tax Withheld (BIR Form 2307)"><F.Money field="i15" /></F.Q>
          <F.Q item="Item 16" label="Tax Paid in Previously Filed Return (if amended)"><F.Money field="i16" /></F.Q>
          <F.Q label="Surcharge"><F.Money field="i20" /></F.Q>
          <F.Q label="Interest"><F.Money field="i21" /></F.Q>
          <F.Result rows={[
            { label: "Total tax due", value: comp.i14 }, { label: "Less credits", value: comp.i18 },
            { label: comp.i24 < 0 ? "Overpayment" : "Total amount payable", value: comp.i24, big: true },
          ]} />
        </>
      ),
    },
    {
      part: "Review", tab: "Review", title: "Review & generate",
      desc: "Summary of your 2551Q. Open the official form to print or save as PDF.",
      render: () => (
        <F.Result rows={[
          { label: "Taxpayer", value: name, peso: false },
          { label: "Year · Quarter", value: (data.year || "—") + " · " + (data.quarter || "—"), peso: false },
          { label: "Total tax due", value: comp.i14 },
          { label: comp.i24 < 0 ? "Overpayment" : "Total payable", value: comp.i24, big: true },
        ]} />
      ),
    },
  ];
  return <GuidedShell steps={steps} onViewForm={onViewForm} onPrint={onPrint} />;
}

Object.assign(window, { Guided1701, Guided1701Q, Guided2550Q, Guided2551Q });

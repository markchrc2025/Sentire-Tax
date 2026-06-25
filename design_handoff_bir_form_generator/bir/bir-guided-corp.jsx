// bir-guided-corp.jsx — guided wizards for 1702-RT and 1702Q (corporations)
// Exports: Guided1702RT, Guided1702Q

/* ============ 1702-RT — Annual Corporate ITR (Regular Rate) ============ */
function Guided1702RT({ tp, data, set, comp, onViewForm, onPrint }) {
  const F = makeGuided(data, set);
  const name = gName(tp);
  const steps = [
    {
      part: "Part I", tab: "Details", title: "Filing details",
      desc: "Which annual corporate return is this? The company's details come from the taxpayer profile.",
      render: () => (
        <>
          <F.ReadOnly items={[
            { label: "Registered Name", value: name }, { label: "TIN", value: tp && tp.tin },
            { label: "RDO Code", value: tp && tp.rdo }, { label: "Address", value: tp ? [tp.address, tp.city, tp.zip].filter(Boolean).join(", ") : "" },
          ]} />
          <F.Q item="Item 2" label="Year Ended (MM/YYYY)" req><F.Txt field="year" ph="2024" maxw={140} /></F.Q>
          <F.Q item="Item 3" label="Is this an Amended Return?"><F.YesNo field="amended" /></F.Q>
          <F.Q item="Item 13" label="Method of Deductions" req>
            <F.Cards field="method" cols={2} options={[
              { val: "itemized", title: "Itemized Deductions", note: "Actual business expenses [Sec. 34(A-J)]." },
              { val: "osd", title: "OSD (40% of Gross Income)", note: "No receipts needed [Sec. 34(L)]." },
            ]} />
          </F.Q>
        </>
      ),
    },
    {
      part: "Part IV", tab: "Income", title: "Income & deductions",
      desc: "Enter the company's sales and costs. We compute gross income, the chosen deduction, and net taxable income.",
      render: () => (
        <>
          <F.Q label="Sales / Receipts / Revenues / Fees" req><F.Money field="i27" /></F.Q>
          <F.Q label="Less: Sales Returns, Allowances & Discounts"><F.Money field="i28" /></F.Q>
          <F.Q label="Less: Cost of Sales/Services"><F.Money field="i30" /></F.Q>
          <F.Q label="Add: Other Taxable Income Not Subject to Final Tax"><F.Money field="i32" /></F.Q>
          {data.method === "osd" ? (
            <F.Q label="Optional Standard Deduction" help="Auto-computed as 40% of gross income."><F.Money ro value={comp.i38} /></F.Q>
          ) : (
            <>
              <F.Q label="Ordinary Allowable Itemized Deductions"><F.Money field="i34" /></F.Q>
              <F.Q label="Special Allowable Itemized Deductions"><F.Money field="i35" /></F.Q>
              <F.Q label="NOLCO (Net Operating Loss Carry-Over)"><F.Money field="i36" /></F.Q>
            </>
          )}
          <F.Result rows={[
            { label: "Gross income (Item 33)", value: comp.i33 },
            { label: "Net taxable income (Item 39)", value: comp.i39 },
          ]} />
        </>
      ),
    },
    {
      part: "Part IV", tab: "Tax due", title: "Tax rate & MCIT",
      desc: "The regular corporate rate is 25% (20% for small corporations). Tax due is the higher of the normal tax or the 2% Minimum Corporate Income Tax (MCIT).",
      render: () => (
        <>
          <F.Q item="Item 40" label="Applicable Income Tax Rate (%)" help="25% standard; 20% if net taxable income ≤ ₱5M and total assets ≤ ₱100M.">
            <F.Txt field="rate" ph="25" maxw={100} />
          </F.Q>
          <F.Result rows={[
            { label: "Income tax (normal) — Item 41", value: comp.i41 },
            { label: "MCIT 2% — Item 42", value: comp.i42 },
            { label: comp.mcitApplies ? "Tax due (MCIT applies)" : "Tax due (normal)", value: comp.i43, big: true },
          ]} />
          {comp.mcitApplies && <div className="g-overpay" style={{ background: "#fdf6ec", color: "#b07a2e" }}>MCIT exceeds the normal tax, so the 2% MCIT is used as your tax due.</div>}
        </>
      ),
    },
    {
      part: "Part IV", tab: "Credits", title: "Tax credits & payments",
      desc: "Quarterly payments and creditable withholding reduce what you still owe.",
      render: () => (
        <>
          <F.Q label="Prior Year’s Excess Credits other than MCIT"><F.Money field="i44" /></F.Q>
          <F.Q label="Income Tax Payments from Previous Quarters (Regular)"><F.Money field="i46" /></F.Q>
          <F.Q label="Creditable Tax Withheld from Previous Quarters (2307)"><F.Money field="i48" /></F.Q>
          <F.Q label="Creditable Tax Withheld for the 4th Quarter (2307)"><F.Money field="i49" /></F.Q>
          <F.Result rows={[
            { label: "Total tax credits (Item 55)", value: comp.i55 },
            { label: "Net tax payable (Item 56)", value: comp.i56, big: true },
          ]} />
        </>
      ),
    },
    {
      part: "Part II", tab: "Payable", title: "Penalties & amount payable",
      desc: "Add penalties only if filing late.",
      render: () => (
        <>
          <F.Q label="Surcharge"><F.Money field="i17" /></F.Q>
          <F.Q label="Interest"><F.Money field="i18" /></F.Q>
          <F.Q label="Compromise"><F.Money field="i19" /></F.Q>
          <F.Result rows={[
            { label: "Net tax payable", value: comp.i16 }, { label: "Total penalties", value: comp.i20 },
            { label: comp.i21 < 0 ? "Overpayment" : "Total amount payable", value: comp.i21, big: true },
          ]} />
        </>
      ),
    },
    {
      part: "Review", tab: "Review", title: "Review & generate",
      desc: "Summary of your 1702-RT. Open the official form to print or save as PDF.",
      render: () => (
        <F.Result rows={[
          { label: "Corporation", value: name, peso: false },
          { label: "Year · Method", value: (data.year || "—") + " · " + (data.method === "osd" ? "OSD" : "Itemized"), peso: false },
          { label: "Net taxable income", value: comp.i39 }, { label: "Tax due", value: comp.i43 },
          { label: comp.i21 < 0 ? "Overpayment" : "Total payable", value: comp.i21, big: true },
        ]} />
      ),
    },
  ];
  return <GuidedShell steps={steps} onViewForm={onViewForm} onPrint={onPrint} />;
}

/* ============ 1702Q — Quarterly Corporate ITR ============ */
function Guided1702Q({ tp, data, set, comp, onViewForm, onPrint }) {
  const F = makeGuided(data, set);
  const name = gName(tp);
  const steps = [
    {
      part: "Part I", tab: "Details", title: "Filing details",
      desc: "Which quarter is this corporate return for? Company details come from the profile.",
      render: () => (
        <>
          <F.ReadOnly items={[
            { label: "Registered Name", value: name }, { label: "TIN", value: tp && tp.tin },
            { label: "RDO Code", value: tp && tp.rdo }, { label: "Address", value: tp ? [tp.address, tp.city].filter(Boolean).join(", ") : "" },
          ]} />
          <F.Q item="Item 2" label="Year Ended (MM/YYYY)" req><F.Txt field="year" ph="2024" maxw={140} /></F.Q>
          <F.Q item="Item 3" label="Quarter" req>
            <F.Cards field="quarter" cols={2} options={[
              { val: "1st", title: "1st Quarter" }, { val: "2nd", title: "2nd Quarter" }, { val: "3rd", title: "3rd Quarter" },
            ]} />
          </F.Q>
          <F.Q item="Item 12" label="Method of Deductions" req>
            <F.Cards field="method" cols={2} options={[
              { val: "itemized", title: "Itemized Deductions" },
              { val: "osd", title: "OSD (40% of Gross Income)" },
            ]} />
          </F.Q>
        </>
      ),
    },
    {
      part: "Schedule 2", tab: "Income", title: "Income this quarter (regular rate)",
      desc: "Enter cumulative figures to date. We compute gross income, the deduction, taxable income, and the tax due (higher of normal tax or 2% MCIT).",
      render: () => (
        <>
          <F.Q label="Sales / Receipts / Revenues / Fees" req><F.Money field="s2_1" /></F.Q>
          <F.Q label="Less: Cost of Sales/Services"><F.Money field="s2_2" /></F.Q>
          <F.Q label="Add: Non-Operating and Other Taxable Income"><F.Money field="s2_4" /></F.Q>
          {data.method === "osd"
            ? <F.Q label="Deductions (OSD 40% of gross income)"><F.Money ro value={comp.s2_6} /></F.Q>
            : <F.Q label="Less: Deductions"><F.Money field="s2_6" /></F.Q>}
          <F.Q label="Add: Taxable Income Previous Quarter(s)"><F.Money field="s2_8" /></F.Q>
          <F.Q label="Applicable Income Tax Rate (%)" help="25% standard; 20% for qualified small corporations."><F.Txt field="rate" ph="25" maxw={100} /></F.Q>
          <F.Result rows={[
            { label: "Total gross income", value: comp.s2_5 },
            { label: "Total taxable income to date", value: comp.s2_9 },
            { label: "Normal tax", value: comp.s2_11 }, { label: "MCIT 2%", value: comp.mcit },
            { label: comp.mcitApplies ? "Income tax due (MCIT)" : "Income tax due", value: comp.s2_13, big: true },
          ]} />
        </>
      ),
    },
    {
      part: "Part II", tab: "Payable", title: "Credits, penalties & total",
      desc: "Apply prior MCIT excess, tax credits/payments, and any penalties.",
      render: () => (
        <>
          <F.Q item="Item 15" label="Less: Unexpired Excess of Prior Year’s MCIT"><F.Money field="i15" /></F.Q>
          <F.Q item="Item 19" label="Total Tax Credits/Payments"><F.Money field="i19" /></F.Q>
          <F.Q label="Surcharge"><F.Money field="i21" /></F.Q>
          <F.Q label="Interest"><F.Money field="i22" /></F.Q>
          <F.Result rows={[
            { label: "Aggregate income tax due", value: comp.i18 }, { label: "Less credits", value: comp.i19 },
            { label: comp.i25 < 0 ? "Overpayment" : "Total amount payable", value: comp.i25, big: true },
          ]} />
        </>
      ),
    },
    {
      part: "Review", tab: "Review", title: "Review & generate",
      desc: "Summary of your 1702Q. Open the official form to print or save as PDF.",
      render: () => (
        <F.Result rows={[
          { label: "Corporation", value: name, peso: false },
          { label: "Year · Quarter", value: (data.year || "—") + " · " + (data.quarter || "—"), peso: false },
          { label: "Taxable income to date", value: comp.s2_9 }, { label: "Income tax due", value: comp.s2_13 },
          { label: comp.i25 < 0 ? "Overpayment" : "Total payable", value: comp.i25, big: true },
        ]} />
      ),
    },
  ];
  return <GuidedShell steps={steps} onViewForm={onViewForm} onPrint={onPrint} />;
}

Object.assign(window, { Guided1702RT, Guided1702Q });

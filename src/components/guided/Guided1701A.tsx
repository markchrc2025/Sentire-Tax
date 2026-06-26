// Guided1701A.tsx — Google-Form-style, by-Part guided entry for 1701A.
// Ported from bir-guided-1701A.jsx (standalone; predates the shared kit).

import { useState, type ReactNode } from "react";
import type { Comp1701A } from "../../lib/compute";
import { fmtAmt } from "../../lib/format";
import { validate1701A } from "../editor/validators";
import { Icon, SIco } from "../icons";
import type { GuidedProps } from "../formProps";
import { makeGuided } from "./guidedKit";

export function Guided1701A({ tp, data, set, comp, onViewForm, onPrint }: GuidedProps<Comp1701A>) {
  const [step, setStep] = useState(0);
  const rawStr = (f: string) => {
    const x = data[f];
    return x == null || typeof x !== "string" ? "" : x;
  };
  const name = tp
    ? tp.kind === "individual"
      ? [tp.lastName, tp.firstName, tp.middleName].filter(Boolean).join(", ")
      : tp.regName
    : "";
  const married = data.civil === "married";
  const spouseOn = married && data.spouseIncome === "yes";
  const rate = (data.taxRate as string) || "";
  const P = "₱ ";

  // Field components come from the shared kit so their identity stays stable
  // across renders — defining them inline here remounted the inputs on every
  // keystroke and dropped the cursor.
  const { Money, Txt, YesNo, Cards, Q } = makeGuided(data, set);
  // Spouse-aware pair — an inline render helper (NOT a component) so the stable
  // Money inputs are reconciled directly and never remounted while typing.
  const pair = (base: string) =>
    spouseOn ? (
      <div className="g-pair">
        <div>
          <div className="g-pair-h">Taxpayer / Filer</div>
          <Money field={base + "A"} />
        </div>
        <div>
          <div className="g-pair-h">Spouse</div>
          <Money field={base + "B"} />
        </div>
      </div>
    ) : (
      <Money field={base + "A"} />
    );

  const atcOptions =
    rate === "eight"
      ? [
          { val: "II015", code: "II015", title: "Business Income — 8% IT Rate" },
          { val: "II017", code: "II017", title: "Income from Profession — 8% IT Rate" },
        ]
      : [
          { val: "II012", code: "II012", title: "Business Income — Graduated IT Rates" },
          { val: "II014", code: "II014", title: "Income from Profession — Graduated IT Rates" },
        ];

  interface Step {
    part: string;
    tab: string;
    title: string;
    desc: string;
    render: () => ReactNode;
  }
  const steps: Step[] = [];

  // STEP — Part I: Filing details
  steps.push({
    part: "Part I",
    tab: "Details",
    title: "Filing details",
    desc: "Tell us which return this is. Your identity details are pulled from the taxpayer profile — no need to retype them.",
    render: () => (
      <>
        <div className="g-readonly">
          <div className="g-readonly-h">
            <Icon d={SIco.check} size={13} />
            Auto-filled from taxpayer profile
          </div>
          <div className="g-ro-grid">
            <div className="g-ro-item">
              <i>Taxpayer</i>
              <b>{name || "—"}</b>
            </div>
            <div className="g-ro-item">
              <i>TIN</i>
              <b>{tp ? tp.tin : "—"}</b>
            </div>
            <div className="g-ro-item">
              <i>RDO Code</i>
              <b>{tp ? tp.rdo : "—"}</b>
            </div>
            <div className="g-ro-item">
              <i>Registered address</i>
              <b>{tp ? [tp.address, tp.city, tp.zip].filter(Boolean).join(", ") : "—"}</b>
            </div>
          </div>
        </div>
        <Q item="Item 1" label="For the Year" help="The taxable calendar year this annual return covers (e.g. 2024)." req>
          <Txt field="year" ph="2024" maxw={140} />
        </Q>
        <Q item="Item 2" label="Is this an Amended Return?" help="Choose Yes only if you are correcting a return you already filed.">
          <YesNo field="amended" />
        </Q>
        <Q item="Item 3" label="Is this a Short Period Return?">
          <YesNo field="shortPeriod" />
        </Q>
        <Q item="Item 6" label="Taxpayer Type" req>
          <Cards
            field="taxpayerType"
            cols={2}
            options={[
              { val: "single", title: "Single Proprietor", note: "You run a business / sole proprietorship." },
              { val: "prof", title: "Professional", note: "You earn from a profession or practice." },
            ]}
          />
        </Q>
        <Q
          item="Item 13"
          label="Are you claiming Foreign Tax Credits?"
          help="Credits for income taxes you already paid to a foreign country."
        >
          <YesNo field="foreignCredit" />
        </Q>
        {data.foreignCredit === "yes" && (
          <Q item="Item 14" label="Foreign Tax Number" req>
            <Txt field="foreignTaxNo" up maxw={260} />
          </Q>
        )}
        <Q item="Item 16" label="Civil Status">
          <Cards
            field="civil"
            cols={2}
            options={[
              { val: "single", title: "Single" },
              { val: "married", title: "Married" },
              { val: "sep", title: "Legally Separated" },
              { val: "widow", title: "Widow/er" },
            ]}
          />
        </Q>
        {married && (
          <>
            <Q
              item="Item 17"
              label="Does your spouse also earn income?"
              help="If yes, you’ll be able to enter the spouse’s figures alongside yours."
            >
              <YesNo field="spouseIncome" />
            </Q>
            <Q
              item="Item 18"
              label="Filing Status"
              help="Married couples file jointly on one return, or separately."
            >
              <Cards
                field="filing"
                cols={2}
                options={[
                  { val: "joint", title: "Joint Filing" },
                  { val: "separate", title: "Separate Filing" },
                ]}
              />
            </Q>
          </>
        )}
      </>
    ),
  });

  // STEP — Part I: Tax rate
  steps.push({
    part: "Part I",
    tab: "Tax rate",
    title: "Choose your tax rate",
    desc: "This is the most important choice — it decides how your tax is computed. The option you pick is irrevocable for the year.",
    render: () => (
      <>
        <Q item="Item 19" label="Which tax rate are you using?" req>
          <Cards
            field="taxRate"
            options={[
              {
                val: "graduated",
                title: "Graduated rates with OSD",
                note: "Standard progressive tax (0%–35%). 40% Optional Standard Deduction is applied to your gross sales/receipts.",
              },
              {
                val: "eight",
                title: "8% flat income tax rate",
                note: "8% on gross sales/receipts above ₱250,000, in lieu of graduated rates + percentage tax. Available only if gross sales do not exceed ₱3,000,000.",
              },
            ]}
          />
        </Q>
        {rate && (
          <Q
            item="Item 7"
            label="Alphanumeric Tax Code (ATC)"
            help="Pick the code that matches your income source. We’ve narrowed it to the codes valid for your chosen rate."
            req
          >
            <Cards field="atc" cols={2} options={atcOptions} />
          </Q>
        )}
      </>
    ),
  });

  // STEP — Part IV: Income & computation
  steps.push({
    part: "Part IV",
    tab: "Income",
    title: rate === "eight" ? "Income (8% rate)" : "Income & deductions",
    desc:
      rate === "eight"
        ? "Enter your gross sales/receipts. We deduct the ₱250,000 relief and apply the 8% rate automatically."
        : "Enter your gross sales and any returns. We compute the 40% OSD, your net income, and the tax due from the TRAIN tax table.",
    render: () =>
      rate === "eight" ? (
        <>
          <Q item="Item 47" label="Sales / Revenues / Receipts / Fees" help="Total gross sales or receipts for the year (net of returns below)." req>
            {pair("i47")}
          </Q>
          <Q item="Item 48" label="Less: Sales Returns, Allowances and Discounts">
            {pair("i48")}
          </Q>
          <Q item="Item 50–51" label="Other Non-Operating Income" help="Any other taxable income not from your main operations.">
            <Txt field="i50label" ph="Specify (optional)" maxw={300} />
            <div style={{ height: 8 }} />
            {pair("i50")}
          </Q>
          <div className="g-result hl">
            <div className="g-result-row"><span>Net sales (Item 49)</span><b>{P}{fmtAmt(comp.A.i49)}</b></div>
            <div className="g-result-row"><span>Less: relief (Item 54)</span><b>{P}{fmtAmt(comp.A.i54)}</b></div>
            <div className="g-result-row"><span>Taxable income (Item 55)</span><b>{P}{fmtAmt(comp.A.i55)}</b></div>
            <div className="g-result-row big"><span>Tax due @ 8% (Item 56)</span><b>{P}{fmtAmt(comp.A.i56)}</b></div>
            {spouseOn && <div className="g-result-row"><span>Spouse tax due</span><b>{P}{fmtAmt(comp.B.i56)}</b></div>}
          </div>
        </>
      ) : (
        <>
          <Q item="Item 36" label="Sales / Revenues / Receipts / Fees" help="Total gross sales or receipts for the year." req>
            {pair("i36")}
          </Q>
          <Q item="Item 37" label="Less: Sales Returns, Allowances and Discounts">
            {pair("i37")}
          </Q>
          <Q item="Item 41–42" label="Other Non-Operating Income" help="Other taxable income not from your main operations (optional).">
            <Txt field="i41label" ph="Specify (optional)" maxw={300} />
            <div style={{ height: 8 }} />
            {pair("i41")}
          </Q>
          <Q item="Item 43" label="Share in income from a General Professional Partnership (GPP)">
            {pair("i43")}
          </Q>
          <div className="g-result hl">
            <div className="g-result-row"><span>Net sales (Item 38)</span><b>{P}{fmtAmt(comp.A.i38)}</b></div>
            <div className="g-result-row"><span>Less: OSD 40% (Item 39)</span><b>{P}{fmtAmt(comp.A.i39)}</b></div>
            <div className="g-result-row"><span>Net income (Item 40)</span><b>{P}{fmtAmt(comp.A.i40)}</b></div>
            <div className="g-result-row"><span>Total taxable income (Item 45)</span><b>{P}{fmtAmt(comp.A.i45)}</b></div>
            <div className="g-result-row big"><span>Tax due (Item 46)</span><b>{P}{fmtAmt(comp.A.i46)}</b></div>
            {spouseOn && <div className="g-result-row"><span>Spouse tax due</span><b>{P}{fmtAmt(comp.B.i46)}</b></div>}
          </div>
        </>
      ),
  });

  // STEP — Part IV.C: Credits
  steps.push({
    part: "Part IV.C",
    tab: "Credits",
    title: "Tax credits & payments",
    desc: "Enter any taxes you’ve already paid or that were withheld — these reduce what you still owe. Leave blank if none. (Attach proof when filing.)",
    render: () => (
      <>
        <Q item="Item 57" label="Prior Year’s Excess Credits">{pair("i57")}</Q>
        <Q item="Item 58" label="Tax Payments for the First Three (3) Quarters" help="What you paid on your 1701Q quarterly returns.">{pair("i58")}</Q>
        <Q item="Item 59" label="Creditable Tax Withheld for the First Three (3) Quarters">{pair("i59")}</Q>
        <Q item="Item 60" label="Creditable Tax Withheld per BIR Form 2307 (4th Quarter)" help="From the 2307 certificates issued to you for Q4.">{pair("i60")}</Q>
        <Q item="Item 61" label="Tax Paid in Previously Filed Return (if amended)">{pair("i61")}</Q>
        <Q item="Item 62" label="Foreign Tax Credits, if applicable">{pair("i62")}</Q>
        <div className="g-result hl">
          <div className="g-result-row"><span>Total tax credits (Item 64)</span><b>{P}{fmtAmt(comp.A.i64)}</b></div>
          <div className="g-result-row big"><span>Net tax payable (Item 65)</span><b>{P}{fmtAmt(comp.A.i65)}</b></div>
        </div>
      </>
    ),
  });

  // STEP — Part II: Penalties, installment, payable
  const overpay = comp.i30 < 0;
  steps.push({
    part: "Part II",
    tab: "Payable",
    title: "Total tax payable",
    desc: "Add any penalties (only if you’re filing late), optionally split into two installments, and see the final amount.",
    render: () => (
      <>
        <Q item="Item 23" label="Portion allowed for 2nd installment" help="You may pay up to 50% of the tax due now and the rest on or before October 15. Enter the amount to defer, or leave blank.">
          {pair("i23")}
        </Q>
        <div className="g-subsec">
          <div className="g-subsec-h">
            <Icon d={SIco.warn} size={15} style={{ color: "#d08a2e" }} />
            Penalties (only if filed late)
          </div>
          <Q item="Item 25" label="Surcharge">{pair("i25")}</Q>
          <Q item="Item 26" label="Interest">{pair("i26")}</Q>
          <Q item="Item 27" label="Compromise">{pair("i27")}</Q>
        </div>
        <Q item="Item 31" label="Number of Attachments" help="Supporting documents you’re attaching (e.g. 2307 certificates, financial statements).">
          <Txt field="attachments" ph="0" maxw={120} />
        </Q>
        {overpay && (
          <Q label="You have an overpayment — how should it be handled?" help="Mark one. Once chosen, it’s irrevocable.">
            <Cards
              field="over"
              options={[
                { val: "refund", title: "To be refunded" },
                { val: "tcc", title: "To be issued a Tax Credit Certificate (TCC)" },
                { val: "carry", title: "To be carried over as a tax credit for next year/quarter" },
              ]}
            />
          </Q>
        )}
        <div className="g-result hl">
          <div className="g-result-row"><span>Tax due (Item 20)</span><b>{P}{fmtAmt(comp.A.i20 + comp.B.i20)}</b></div>
          <div className="g-result-row"><span>Less: credits (Item 21)</span><b>{P}{fmtAmt(comp.A.i21 + comp.B.i21)}</b></div>
          <div className="g-result-row"><span>Total penalties (Item 28)</span><b>{P}{fmtAmt(comp.A.i28 + comp.B.i28)}</b></div>
          <div className="g-result-row big">
            <span>{overpay ? "Aggregate overpayment" : "Aggregate amount payable"} (Item 30)</span>
            <b>{P}{fmtAmt(comp.i30)}</b>
          </div>
        </div>
      </>
    ),
  });

  // STEP — Part III: Payment details
  steps.push({
    part: "Part III",
    tab: "Payment",
    title: "Details of payment",
    desc: "How are you paying? Fill in only the rows that apply — you can skip this and add it later.",
    render: () => (
      <>
        {(
          [
            ["32", "Cash / Bank Debit Memo", "p32"],
            ["33", "Check", "p33"],
            ["34", "Tax Debit Memo", "p34"],
          ] as Array<[string, string, string]>
        ).map(([no, lbl, k]) => (
          <Q key={k} item={"Item " + no} label={lbl}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxWidth: 420 }}>
              <Txt field={k + "bank"} ph="Drawee bank / agency" />
              <Txt field={k + "num"} ph="Number" />
              <Txt field={k + "date"} ph="Date (MM/DD/YYYY)" />
              <div className="g-money">
                <span className="peso">₱</span>
                <input
                  inputMode="decimal"
                  value={rawStr(k + "amt")}
                  placeholder="0"
                  onChange={(e) => set(k + "amt", e.target.value.replace(/[^0-9.\-]/g, ""))}
                />
              </div>
            </div>
          </Q>
        ))}
      </>
    ),
  });

  // STEP — Review
  const checks = validate1701A(data, comp, { tp: tp ?? null, period: rawStr("year") });
  const blockingChecks = checks.filter((c) => c.level === "error" || c.level === "warn");
  steps.push({
    part: "Review",
    tab: "Review",
    title: "Review & generate",
    desc: "Here’s a summary of your 1701A. Fix any flagged items, then open the official form to print or save as PDF.",
    render: () => (
      <>
        <div className="g-result hl" style={{ marginTop: 0 }}>
          <div className="g-result-row"><span>Taxpayer</span><b>{name}</b></div>
          <div className="g-result-row">
            <span>Year · Rate</span>
            <b>
              {rawStr("year") || "—"} · {rate === "eight" ? "8% flat" : rate === "graduated" ? "Graduated + OSD" : "—"}
            </b>
          </div>
          <div className="g-result-row"><span>Tax due</span><b>{P}{fmtAmt(comp.A.i20 + comp.B.i20)}</b></div>
          <div className="g-result-row"><span>Tax credits</span><b>{P}{fmtAmt(comp.A.i21 + comp.B.i21)}</b></div>
          <div className="g-result-row big"><span>{overpay ? "Overpayment" : "Amount payable"}</span><b>{P}{fmtAmt(comp.i30)}</b></div>
        </div>
        <div className="g-subsec">
          <div className="g-subsec-h">Checklist</div>
          {blockingChecks.length === 0 && (
            <ul className="g-review-list">
              <li>
                <Icon d={SIco.check} size={15} className="g-rev-ok" />
                Everything looks complete — ready to print &amp; file.
              </li>
            </ul>
          )}
          {checks.length > 0 && (
            <ul className="g-review-list">
              {checks.map((c, i) => (
                <li key={i}>
                  <Icon
                    d={c.level === "info" ? SIco.info : c.level === "ok" ? SIco.check : SIco.warn}
                    size={15}
                    className={c.level === "info" ? "g-rev-ok" : "g-rev-warn"}
                  />
                  {c.msg}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button className="s-btn s-btn-primary" onClick={onViewForm}>
            <Icon d={SIco.file} size={16} />
            View official form
          </button>
          <button className="s-btn" onClick={onPrint}>
            <Icon d={SIco.print} size={16} />
            Print / Save as PDF
          </button>
        </div>
      </>
    ),
  });

  const cur = steps[step];
  const lastIdx = steps.length - 1;

  return (
    <div className="g-scroll">
      <div className="g-shell">
        <div className="g-tabs" role="tablist">
          {steps.map((s, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === step}
              className={"g-tab" + (i === step ? " on" : i < step ? " done" : "")}
              onClick={() => setStep(i)}
            >
              <span className="g-tab-dot">{i < step ? <Icon d={SIco.check} size={10} /> : i + 1}</span>
              <span className="g-tab-lbl">
                <b>{s.part}</b>
                <i>{s.tab}</i>
              </span>
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
          </div>
        </div>

        <div className="g-nav">
          <button
            className="s-btn"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            style={step === 0 ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
          >
            <Icon d={SIco.back} size={16} />
            Back
          </button>
          <span className="g-nav-mid">
            Step {step + 1} of {steps.length}
          </span>
          {step < lastIdx ? (
            <button className="s-btn s-btn-primary" onClick={() => setStep((s) => Math.min(lastIdx, s + 1))}>
              Next
              <Icon d={SIco.chevR} size={16} />
            </button>
          ) : (
            <button className="s-btn s-btn-primary" onClick={onViewForm}>
              Finish
              <Icon d={SIco.check} size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

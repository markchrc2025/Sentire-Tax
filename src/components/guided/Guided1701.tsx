// Guided1701.tsx — guided wizard for 1701 (Annual ITR, mixed income).
// Aligned with the official Jan-2018 form: Part I background (items 1-21A),
// Part IV spouse background (items 1-12), Part V computation, Part VII credits,
// Part II payable. Field keys match the authentic eBIRForms builder (build1701).

import type { Comp1701 } from "../../lib/compute";
import type { GuidedProps } from "../formProps";
import { makeGuided, gName, GuidedShell, type GuidedStep } from "./guidedKit";

// Official Item 6 / Part IV Item 3 taxpayer-type choices.
const TAXPAYER_TYPES = [
  { val: "single", title: "Single Proprietor", note: "Runs a business / sole proprietorship." },
  { val: "prof", title: "Professional", note: "Earns from a profession or practice." },
  { val: "estate", title: "Estate" },
  { val: "trust", title: "Trust" },
  { val: "comp", title: "Compensation Earner", note: "Earns purely from employment." },
];

// Official Item 7 / Part IV Item 4 ATC choices (all seven).
const ATC_OPTIONS = [
  { val: "II011", code: "II011", title: "Compensation Income" },
  { val: "II012", code: "II012", title: "Business Income — Graduated IT Rates" },
  { val: "II013", code: "II013", title: "Mixed Income — Graduated IT Rates" },
  { val: "II014", code: "II014", title: "Income from Profession — Graduated IT Rates" },
  { val: "II015", code: "II015", title: "Business Income — 8% IT Rate" },
  { val: "II016", code: "II016", title: "Mixed Income — 8% IT Rate" },
  { val: "II017", code: "II017", title: "Income from Profession — 8% IT Rate" },
];

// Schedule 4 ordinary allowable itemized deduction categories (items 1-16).
const SCHED4 = [
  "Amortizations",
  "Bad Debts",
  "Charitable and Other Contributions",
  "Depletion",
  "Depreciation",
  "Entertainment, Amusement and Recreation",
  "Fringe Benefits",
  "Interest",
  "Losses",
  "Pension Trusts",
  "Rental",
  "Research and Development",
  "Salaries, Wages and Allowances",
  "SSS, GSIS, Philhealth, HDMF and Other Contributions",
  "Taxes and Licenses",
  "Transportation and Travel",
];

export function Guided1701({ tp, data, set, comp, onViewForm, onPrint }: GuidedProps<Comp1701>) {
  const F = makeGuided(data, set);
  const name = gName(tp);
  const A = comp.A;
  const year = (data.year as string) || "—";
  const rateA = data.rateA as string | undefined;
  const married = data.civil === "married";

  const steps: GuidedStep[] = [
    // ───────────────────────── Part I — filing details
    {
      part: "Part I",
      tab: "Details",
      title: "Filing details",
      desc: "Which annual return is this, and what kind of income earner are you? Your identity details come from the taxpayer profile.",
      render: () => (
        <>
          <F.ReadOnly
            items={[
              { label: "Taxpayer", value: name },
              { label: "TIN", value: tp && tp.tin },
              { label: "RDO Code", value: tp && tp.rdo },
              { label: "Citizenship", value: tp && tp.citizenship },
              { label: "Address", value: tp ? [tp.address, tp.city, tp.zip].filter(Boolean).join(", ") : "" },
            ]}
          />
          <F.Q item="Item 1" label="For the Year" help="Taxable year covered (e.g. 2024)." req>
            <F.Txt field="year" ph="2024" maxw={140} />
          </F.Q>
          <F.Q item="Item 2" label="Is this an Amended Return?">
            <F.YesNo field="amended" />
          </F.Q>
          <F.Q item="Item 3" label="Is this a Short Period Return?">
            <F.YesNo field="shortPeriod" />
          </F.Q>
          <F.Q item="Item 6" label="Taxpayer Type" req>
            <F.Cards field="taxpayerType" cols={2} options={TAXPAYER_TYPES} />
          </F.Q>
          <F.Q item="Item 7" label="Alphanumeric Tax Code (ATC)" help="Pick the code that matches your income source and rate.">
            <F.Cards field="atc" cols={2} options={ATC_OPTIONS} />
          </F.Q>
        </>
      ),
    },
    // ───────────────────────── Part I — status & flags
    {
      part: "Part I",
      tab: "Status",
      title: "Status & income flags",
      desc: "Foreign tax credits, civil status, and whether any income is exempt or under a special/preferential rate.",
      render: () => (
        <>
          <F.Q
            item="Item 13"
            label="Are you claiming Foreign Tax Credits?"
            help="Credits for income taxes you already paid to a foreign country."
          >
            <F.YesNo field="foreignCredit" />
          </F.Q>
          {data.foreignCredit === "yes" && (
            <F.Q item="Item 14" label="Foreign Tax Number" req>
              <F.Txt field="foreignTaxNo" up maxw={260} />
            </F.Q>
          )}
          <F.Q item="Item 16" label="Civil Status">
            <F.Cards
              field="civil"
              cols={2}
              options={[
                { val: "single", title: "Single" },
                { val: "married", title: "Married" },
                { val: "sep", title: "Legally Separated" },
                { val: "widow", title: "Widow/er" },
              ]}
            />
          </F.Q>
          {married && (
            <>
              <F.Q item="Item 17" label="Does your spouse also earn income?" help="If yes, you’ll enter the spouse’s figures alongside yours.">
                <F.YesNo field="spouseIncome" />
              </F.Q>
              <F.Q item="Item 18" label="Filing Status">
                <F.Cards
                  field="filing"
                  cols={2}
                  options={[
                    { val: "joint", title: "Joint Filing" },
                    { val: "separate", title: "Separate Filing" },
                  ]}
                />
              </F.Q>
            </>
          )}
          <F.Q item="Item 19" label="Is any income EXEMPT from Income Tax?" help="Mark Yes if you have income that is exempt by law.">
            <F.YesNo field="incomeExempt" />
          </F.Q>
          <F.Q
            item="Item 20"
            label="Is any income subject to a SPECIAL / PREFERENTIAL RATE?"
            help="Mark Yes if part of your income is taxed at a special/preferential rate."
          >
            <F.YesNo field="incomeSpecial" />
          </F.Q>
        </>
      ),
    },
    // ───────────────────────── Part I — tax rate & method
    {
      part: "Part I",
      tab: "Tax rate",
      title: "Tax rate & deduction method",
      desc: "How is your business income taxed? This drives the computation. The choice is irrevocable for the year.",
      render: () => (
        <>
          <F.Q item="Item 21" label="Tax rate" req>
            <F.Cards
              field="rateA"
              options={[
                { val: "graduated", title: "Graduated rates", note: "Progressive 0%–35% on combined taxable income." },
                {
                  val: "eight",
                  title: "8% flat on business income",
                  note: "8% on gross sales/receipts (≤₱3M), plus graduated on compensation.",
                },
              ]}
            />
          </F.Q>
          {rateA !== "eight" && (
            <F.Q item="Item 21A" label="Method of deduction">
              <F.Cards
                field="methodA"
                cols={2}
                options={[
                  { val: "itemized", title: "Itemized Deduction", note: "Actual business expenses [Sec. 34(A-J)]." },
                  { val: "osd", title: "OSD (40%)", note: "40% of net sales/receipts [Sec. 34(L)]." },
                ]}
              />
            </F.Q>
          )}
        </>
      ),
    },
  ];

  // ───────────────────────── Part IV — spouse background (only when married)
  if (married) {
    steps.push({
      part: "Part IV",
      tab: "Spouse",
      title: "Spouse background information",
      desc: "Since you’re married, the return needs your spouse’s background details (Part IV). Fill in what applies.",
      render: () => (
        <>
          <F.Q item="Item 1" label="Spouse’s TIN" help="Your spouse’s Taxpayer Identification Number (digits only).">
            <F.Txt field="spouseTin" ph="000 000 000 00000" maxw={260} />
          </F.Q>
          <F.Q item="Item 2" label="Spouse’s RDO Code">
            <F.Txt field="spouseRdo" ph="000" maxw={120} />
          </F.Q>
          <F.Q item="Item 3" label="Filer’s Spouse Type">
            <F.Cards field="spouseType" cols={2} options={TAXPAYER_TYPES} />
          </F.Q>
          <F.Q item="Item 4" label="Spouse’s Alphanumeric Tax Code (ATC)">
            <F.Cards field="spouseAtc" cols={2} options={ATC_OPTIONS} />
          </F.Q>
          <F.Q item="Item 5" label="Spouse’s Name" help="Last Name, First Name, Middle Name.">
            <F.Txt field="spouseName" up maxw={360} />
          </F.Q>
          <F.Q item="Item 6" label="Spouse’s Contact Number">
            <F.Txt field="spouseContact" maxw={220} />
          </F.Q>
          <F.Q item="Item 7" label="Spouse’s Citizenship">
            <F.Txt field="spouseCitizenship" up maxw={220} />
          </F.Q>
          <F.Q item="Item 8" label="Is your spouse claiming Foreign Tax Credits?">
            <F.YesNo field="spouseForeignCredit" />
          </F.Q>
          {data.spouseForeignCredit === "yes" && (
            <F.Q item="Item 9" label="Spouse’s Foreign Tax Number" req>
              <F.Txt field="spouseForeignTaxNo" up maxw={260} />
            </F.Q>
          )}
          <F.Q item="Item 10" label="Is any spouse income EXEMPT from Income Tax?">
            <F.YesNo field="spouseIncomeExempt" />
          </F.Q>
          <F.Q item="Item 11" label="Is any spouse income subject to a SPECIAL / PREFERENTIAL RATE?">
            <F.YesNo field="spouseIncomeSpecial" />
          </F.Q>
          <F.Q item="Item 12" label="Spouse’s Tax Rate">
            <F.Cards
              field="spouseRate"
              options={[
                { val: "graduated", title: "Graduated rates", note: "Progressive 0%–35%." },
                { val: "eight", title: "8% flat on business income", note: "8% on gross sales/receipts (≤₱3M)." },
              ]}
            />
          </F.Q>
          {data.spouseRate !== "eight" && (
            <F.Q item="Item 12A" label="Spouse’s Method of deduction">
              <F.Cards
                field="spouseMethod"
                cols={2}
                options={[
                  { val: "itemized", title: "Itemized Deduction" },
                  { val: "osd", title: "OSD (40%)" },
                ]}
              />
            </F.Q>
          )}
        </>
      ),
    });
  }

  // ───────────────────────── Part V — income & computation
  steps.push(
    {
      part: "Part V",
      tab: "Income",
      title: "Income",
      desc: "Enter your compensation income and business figures. We compute net business income and tax due.",
      render: () => (
        <>
          <F.Q label="Taxable Compensation Income (from BIR Form 2316)" help="Your taxable salary, if employed.">
            <F.Money field="compA" />
          </F.Q>
          <F.Q label="Sales / Revenues / Receipts / Fees" req>
            <F.Money field="salesA" />
          </F.Q>
          <F.Q label="Less: Sales Returns, Allowances & Discounts">
            <F.Money field="returnsA" />
          </F.Q>
          <F.Q label="Less: Cost of Sales/Services">
            <F.Money field="cogsA" />
          </F.Q>
          {rateA !== "eight" && data.methodA === "itemized" && (
            <p className="g-q-help" style={{ marginTop: -4 }}>
              Enter your itemized business expenses in the next step (Schedule 4 &amp; 5).
            </p>
          )}
          <F.Q label="Add: Other Taxable / Non-Operating Income">
            <F.Money field="otherA" />
          </F.Q>
          <F.Result
            rows={[
              { label: "Net business income", value: A.netBizTotal },
              { label: "Total taxable income", value: A.taxableTotal },
              { label: "Tax due", value: A.taxDue, big: true },
            ]}
          />
        </>
      ),
    },
  );

  // ───────────────────────── Part V — itemized deductions (Schedule 4 & 5)
  if (rateA !== "eight" && data.methodA === "itemized") {
    steps.push({
      part: "Part V",
      tab: "Expenses",
      title: "Itemized deductions (Schedule 4 & 5)",
      desc: "Enter your business expenses by category. They total into your Ordinary Allowable Itemized Deductions and reduce your taxable income.",
      render: () => (
        <>
          {SCHED4.map((lbl, i) => (
            <F.Q key={`s4_${i + 1}`} label={`${i + 1}. ${lbl}`}>
              <F.Money field={`s4_${i + 1}A`} />
            </F.Q>
          ))}
          <F.Q label="17a. Others — Janitorial and Messengerial Services">
            <F.Money field="s4_17aA" />
          </F.Q>
          <F.Q label="17b. Others — Professional Fees">
            <F.Money field="s4_17bA" />
          </F.Q>
          <F.Q label="17c. Others — Security Services">
            <F.Money field="s4_17cA" />
          </F.Q>
          <F.Q label="17d. Others (specify)">
            <F.Txt field="s4_17ddescA" ph="Specify (optional)" maxw={280} />
            <div style={{ height: 8 }} />
            <F.Money field="s4_17dA" />
          </F.Q>
          <div className="g-subsec">
            <div className="g-subsec-h">Schedule 5 — Special Allowable Itemized Deductions (optional)</div>
            <F.Q label="Total Special Allowable Itemized Deductions" help="Deductions allowed under special laws, with legal basis.">
              <F.Money field="s5_3amt" />
            </F.Q>
          </div>
          <F.Result
            rows={[
              { label: "Total allowable deductions (Sched 4 + 5)", value: A.deductions },
              { label: "Net business income", value: A.netBizTotal },
              { label: "Tax due", value: A.taxDue, big: true },
            ]}
          />
        </>
      ),
    });
  }

  steps.push(
    {
      part: "Part VII",
      tab: "Credits",
      title: "Tax credits & payments",
      desc: "Taxes already paid or withheld reduce what you owe. Leave blank if none. (Attach proof when filing.)",
      render: () => (
        <>
          <F.Q label="Prior Year’s Excess Credits">
            <F.Money field="excessA" />
          </F.Q>
          <F.Q label="Tax Payments for the First Three Quarters (1701Q)">
            <F.Money field="prevPaidA" />
          </F.Q>
          <F.Q label="Creditable Tax Withheld per BIR Form 2307">
            <F.Money field="cwtA" />
          </F.Q>
          <F.Q label="Tax Withheld on Compensation per BIR Form 2316">
            <F.Money field="compCwtA" />
          </F.Q>
          <F.Result
            rows={[
              { label: "Total tax credits", value: A.credits },
              { label: "Net tax payable", value: A.payable, big: true },
            ]}
          />
        </>
      ),
    },
    {
      part: "Part II",
      tab: "Payable",
      title: "Penalties & amount payable",
      desc: "Add penalties only if filing late. Optionally defer part to a 2nd installment.",
      render: () => (
        <>
          <F.Q item="Item 25" label="Portion allowed for 2nd installment" help="Up to 50% of tax due may be deferred to October 15.">
            <F.Money field="installA" />
          </F.Q>
          <F.Q label="Surcharge / Interest / Compromise (penalties)">
            <F.Money field="penA" />
          </F.Q>
          <F.Result
            rows={[
              { label: "Tax due", value: A.taxDue },
              { label: "Less credits", value: A.credits },
              { label: comp.aggregate < 0 ? "Overpayment" : "Amount payable", value: comp.aggregate, big: true },
            ]}
          />
        </>
      ),
    },
    {
      part: "Review",
      tab: "Review",
      title: "Review & generate",
      desc: "Summary of your 1701. Open the official form to print or save as PDF.",
      render: () => (
        <F.Result
          rows={[
            { label: "Taxpayer", value: name, peso: false },
            {
              label: "Year · Rate",
              value: year + " · " + (rateA === "eight" ? "8% + graduated" : "Graduated"),
              peso: false,
            },
            { label: "Tax due", value: comp.A.taxDue + comp.B.taxDue },
            { label: comp.aggregate < 0 ? "Overpayment" : "Amount payable", value: comp.aggregate, big: true },
          ]}
        />
      ),
    },
  );

  return <GuidedShell steps={steps} onViewForm={onViewForm} onPrint={onPrint} />;
}

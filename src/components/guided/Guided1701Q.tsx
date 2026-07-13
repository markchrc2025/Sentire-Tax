// Guided1701Q.tsx — guided wizard for the 1701Q quarterly ITR.
// Aligned with the official Jan-2018 (ENCS) form: Part I background (items 1-16),
// Part II spouse background (items 17-25, only when married), Part V computation
// (Schedule I/II), Schedule III credits (items 55-61), Schedule IV penalties
// (items 64-66). Field keys match the 1701Q compute engine + XML builder.

import type { Comp1701Q } from "../../lib/compute";
import { fmtDate } from "../../lib/format";
import type { GuidedProps } from "../formProps";
import { GuidedShell, gName, makeGuided, type GuidedStep } from "./guidedKit";

// Item 7 / Item 19 taxpayer-type choices.
const FILER_TYPES = [
  { val: "single", title: "Single Proprietor", note: "Runs a business / sole proprietorship." },
  { val: "prof", title: "Professional", note: "Earns from a profession or practice." },
  { val: "estate", title: "Estate" },
  { val: "trust", title: "Trust" },
];
const SPOUSE_TYPES = [
  { val: "single", title: "Single Proprietor" },
  { val: "prof", title: "Professional" },
  { val: "comp", title: "Compensation Earner", note: "Earns purely from employment." },
];

// Item 8 ATC choices (taxpayer); spouse adds II011 Compensation Income.
const ATC_OPTIONS = [
  { val: "II012", code: "II012", title: "Business Income — Graduated IT Rates" },
  { val: "II014", code: "II014", title: "Income from Profession — Graduated IT Rates" },
  { val: "II013", code: "II013", title: "Mixed Income — Graduated IT Rates" },
  { val: "II015", code: "II015", title: "Business Income — 8% IT Rate" },
  { val: "II017", code: "II017", title: "Income from Profession — 8% IT Rate" },
  { val: "II016", code: "II016", title: "Mixed Income — 8% IT Rate" },
];
const SPOUSE_ATC_OPTIONS = [{ val: "II011", code: "II011", title: "Compensation Income" }, ...ATC_OPTIONS];

export function Guided1701Q({ tp, data, set, comp, onViewForm, onPrint }: GuidedProps<Comp1701Q>) {
  const F = makeGuided(data, set);
  const name = gName(tp);
  const A = comp.A;
  const year = (data.year as string) || "—";
  const quarter = (data.quarter as string) || "—";
  const rateA = data.rateA as string | undefined;
  const married = data.maritalStatus === "married";

  const steps: GuidedStep[] = [
    // ───────────────────────── Part I — filing details
    {
      part: "Part I",
      tab: "Details",
      title: "Filing details",
      desc: "Which quarter is this return for, and what kind of income earner are you? Identity details come from the profile.",
      render: () => (
        <>
          <F.ReadOnly
            items={[
              { label: "Taxpayer", value: name },
              { label: "TIN", value: tp && tp.tin },
              { label: "RDO Code", value: tp && tp.rdo },
              { label: "Date of Birth", value: fmtDate(tp && tp.birthdate) },
              { label: "Email", value: tp && tp.email },
              { label: "Citizenship", value: tp && tp.citizenship },
              { label: "Address", value: tp ? [tp.address, tp.city].filter(Boolean).join(", ") : "" },
            ]}
          />
          <F.Q item="Item 1" label="For the Year" req>
            <F.Txt field="year" ph="2024" maxw={140} />
          </F.Q>
          <F.Q item="Item 2" label="Quarter" req>
            <F.Cards
              field="quarter"
              cols={2}
              options={[
                { val: "1st", title: "1st Quarter" },
                { val: "2nd", title: "2nd Quarter" },
                { val: "3rd", title: "3rd Quarter" },
              ]}
            />
          </F.Q>
          <F.Q item="Item 3" label="Is this an Amended Return?">
            <F.YesNo field="amended" />
          </F.Q>
          <F.Q item="Item 4" label="Number of Sheets Attached" help="Count of supporting sheets attached to this return.">
            <F.Txt field="sheets" ph="0" maxw={120} />
          </F.Q>
          <F.Q item="Item 7" label="Taxpayer/Filer Type" req>
            <F.Cards field="filerType" cols={2} options={FILER_TYPES} />
          </F.Q>
          <F.Q item="Item 8" label="Alphanumeric Tax Code (ATC)" help="Pick the code that matches your income source and rate.">
            <F.Cards field="atc" cols={2} options={ATC_OPTIONS} />
          </F.Q>
        </>
      ),
    },
    // ───────────────────────── Part I — foreign credits, marital status
    {
      part: "Part I",
      tab: "Status",
      title: "Foreign credits & marital status",
      desc: "Foreign tax credits, and whether you're married (so we know if a spouse section is needed).",
      render: () => (
        <>
          <F.Q item="Item 15" label="Are you claiming Foreign Tax Credits?" help="Credits for income taxes already paid to a foreign country.">
            <F.YesNo field="foreignCredit" />
          </F.Q>
          {data.foreignCredit === "yes" && (
            <F.Q item="Item 14" label="Foreign Tax Number" req>
              <F.Txt field="foreignTaxNo" up maxw={260} />
            </F.Q>
          )}
          <F.Q label="Marital status" help="If married, we’ll collect your spouse’s background information (Part II).">
            <F.Cards
              field="maritalStatus"
              cols={2}
              options={[
                { val: "single", title: "Single / not applicable" },
                { val: "married", title: "Married" },
              ]}
            />
          </F.Q>
        </>
      ),
    },
    // ───────────────────────── Part I — tax rate & method
    {
      part: "Part I",
      tab: "Tax rate",
      title: "Tax rate & method",
      desc: "Choose how this quarter's income is taxed (irrevocable for the year).",
      render: () => (
        <>
          <F.Q item="Item 16" label="Tax rate" req>
            <F.Cards
              field="rateA"
              options={[
                { val: "graduated", title: "Graduated rates per Tax Table" },
                { val: "eight", title: "8% on gross sales/receipts", note: "In lieu of graduated + percentage tax (≤₱3M)." },
              ]}
            />
          </F.Q>
          {rateA !== "eight" && (
            <F.Q item="Item 16A" label="Method of deduction">
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

  // ───────────────────────── Part II — spouse background (only when married)
  if (married) {
    steps.push({
      part: "Part II",
      tab: "Spouse",
      title: "Spouse background information",
      desc: "Since you’re married, the return needs your spouse’s background details (Part II). Fill in what applies.",
      render: () => (
        <>
          <F.Q item="Item 17" label="Spouse’s TIN" help="Your spouse’s Taxpayer Identification Number (digits only).">
            <F.Txt field="spouseTin" ph="000 000 000 00000" maxw={260} />
          </F.Q>
          <F.Q item="Item 18" label="Spouse’s RDO Code">
            <F.Txt field="spouseRdo" ph="000" maxw={120} />
          </F.Q>
          <F.Q item="Item 19" label="Filer’s Spouse Type">
            <F.Cards field="spouseType" cols={2} options={SPOUSE_TYPES} />
          </F.Q>
          <F.Q item="Item 20" label="Spouse’s Alphanumeric Tax Code (ATC)">
            <F.Cards field="spouseAtc" cols={2} options={SPOUSE_ATC_OPTIONS} />
          </F.Q>
          <F.Q item="Item 21" label="Spouse’s Name" help="Last Name, First Name, Middle Name.">
            <F.Txt field="spouseName" up maxw={360} />
          </F.Q>
          <F.Q item="Item 22" label="Spouse’s Citizenship">
            <F.Txt field="spouseCitizenship" up maxw={220} />
          </F.Q>
          <F.Q item="Item 24" label="Is your spouse claiming Foreign Tax Credits?">
            <F.YesNo field="spouseForeignCredit" />
          </F.Q>
          {data.spouseForeignCredit === "yes" && (
            <F.Q item="Item 23" label="Spouse’s Foreign Tax Number" req>
              <F.Txt field="spouseForeignTaxNo" up maxw={260} />
            </F.Q>
          )}
          <F.Q item="Item 25" label="Spouse’s Tax Rate">
            <F.Cards
              field="rateB"
              options={[
                { val: "graduated", title: "Graduated rates", note: "Progressive 0%–35%." },
                { val: "eight", title: "8% flat on gross sales/receipts", note: "≤₱3M." },
              ]}
            />
          </F.Q>
          {data.rateB !== "eight" && (
            <F.Q item="Item 25A" label="Spouse’s Method of deduction">
              <F.Cards
                field="methodB"
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
  steps.push({
    part: "Part V",
    tab: "Income",
    title: "Income this quarter",
    desc: "Enter cumulative figures to date. We apply the 40% OSD (or your itemized amount) and the tax table.",
    render: () => (
      <>
        <F.Q label="Sales / Revenues / Receipts / Fees (net of returns, allowances & discounts)" req>
          <F.Money field="salesA" />
        </F.Q>
        <F.Q label="Less: Cost of Sales/Services" help="Applicable only if availing Itemized Deductions.">
          <F.Money field="cogsA" />
        </F.Q>
        {rateA !== "eight" && data.methodA === "itemized" && (
          <F.Q label="Total Allowable Itemized Deductions">
            <F.Money field="deductA" />
          </F.Q>
        )}
        <F.Q label="Non-Operating Income (specify)">
          <F.Txt field="nonOpDescA" ph="Description (optional)" maxw={280} />
          <div style={{ height: 8 }} />
          <F.Money field="nonOpA" />
        </F.Q>
        <F.Q label="Amount Received/Share in Income from a GPP">
          <F.Money field="gppA" />
        </F.Q>
        <F.Q label="Add: Taxable Income/(Loss) from Previous Quarter(s)">
          <F.Money field="prevTaxableA" />
        </F.Q>
        {rateA === "eight" && (
          <F.Q label="Add: Total Taxable Income/(Loss) from Previous Quarter (8% — Item 51 of prior quarter)">
            <F.Money field="prev8A" />
          </F.Q>
        )}
        <F.Result
          rows={[
            { label: "Net income this quarter", value: A.netIncome },
            { label: "Total taxable income to date", value: A.taxableCum },
            { label: "Tax due", value: A.taxDue, big: true },
          ]}
        />
      </>
    ),
  });

  // ───────────────────────── Schedule III — credits & payments
  steps.push({
    part: "Part V",
    tab: "Credits",
    title: "Tax credits & payments",
    desc: "Prior payments and withheld taxes reduce what you owe this quarter. Leave blank if none.",
    render: () => (
      <>
        <F.Q label="Prior Year’s Excess Credits">
          <F.Money field="excessA" />
        </F.Q>
        <F.Q label="Tax Payment(s) for the Previous Quarter(s)">
          <F.Money field="prevPaidA" />
        </F.Q>
        <F.Q label="Creditable Tax Withheld for the Previous Quarter(s)">
          <F.Money field="cwtPrevA" />
        </F.Q>
        <F.Q label="Creditable Tax Withheld per BIR Form 2307 for this Quarter">
          <F.Money field="cwtA" />
        </F.Q>
        {data.amended === "yes" && (
          <F.Q label="Tax Paid in Return Previously Filed (Amended Return)">
            <F.Money field="taxPaidPrevA" />
          </F.Q>
        )}
        {data.foreignCredit === "yes" && (
          <F.Q label="Foreign Tax Credits, if applicable">
            <F.Money field="foreignCreditsA" />
          </F.Q>
        )}
        <F.Q label="Other Tax Credits/Payments (specify)">
          <F.Txt field="otherCreditsDescA" ph="Description (optional)" maxw={280} />
          <div style={{ height: 8 }} />
          <F.Money field="otherCreditsA" />
        </F.Q>
        <F.Result
          rows={[
            { label: "Total credits", value: A.credits },
            { label: "Tax payable", value: A.payable, big: true },
          ]}
        />
      </>
    ),
  });

  // ───────────────────────── Schedule IV — penalties & amount payable
  steps.push({
    part: "Part V",
    tab: "Penalties",
    title: "Penalties & amount payable",
    desc: "Add penalties only if filing late (Schedule IV). Leave blank if filing on time.",
    render: () => (
      <>
        <F.Q label="Surcharge">
          <F.Money field="surchargeA" />
        </F.Q>
        <F.Q label="Interest">
          <F.Money field="interestA" />
        </F.Q>
        <F.Q label="Compromise">
          <F.Money field="compromiseA" />
        </F.Q>
        <F.Result
          rows={[
            { label: "Tax payable", value: A.payable },
            { label: "Total penalties", value: A.penalties },
            { label: comp.aggregate < 0 ? "Overpayment" : "Total amount payable", value: comp.aggregate, big: true },
          ]}
        />
      </>
    ),
  });

  // ───────────────────────── Review
  steps.push({
    part: "Review",
    tab: "Review",
    title: "Review & generate",
    desc: "Summary of your 1701Q. Open the official form to print or save as PDF.",
    render: () => (
      <F.Result
        rows={[
          { label: "Taxpayer", value: name, peso: false },
          { label: "Year · Quarter", value: year + " · " + quarter, peso: false },
          { label: "Tax due", value: comp.A.taxDue + comp.B.taxDue },
          { label: comp.aggregate < 0 ? "Overpayment" : "Amount payable", value: comp.aggregate, big: true },
        ]}
      />
    ),
  });

  return <GuidedShell steps={steps} onViewForm={onViewForm} onPrint={onPrint} />;
}

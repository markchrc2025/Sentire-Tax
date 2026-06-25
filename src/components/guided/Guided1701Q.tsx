// Guided1701Q.tsx — guided wizard for the 1701Q quarterly ITR.
// Ported from `Guided1701Q` in bir-guided-returns.jsx (uses the shared kit).

import type { Comp1701Q } from "../../lib/compute";
import type { GuidedProps } from "../formProps";
import { GuidedShell, gName, makeGuided, type GuidedStep } from "./guidedKit";

export function Guided1701Q({ tp, data, set, comp, onViewForm, onPrint }: GuidedProps<Comp1701Q>) {
  const F = makeGuided(data, set);
  const name = gName(tp);
  const A = comp.A;
  const year = (data.year as string) || "—";
  const quarter = (data.quarter as string) || "—";

  const steps: GuidedStep[] = [
    {
      part: "Part I",
      tab: "Details",
      title: "Filing details",
      desc: "Which quarter is this return for? Identity details come from the profile.",
      render: () => (
        <>
          <F.ReadOnly
            items={[
              { label: "Taxpayer", value: name },
              { label: "TIN", value: tp && tp.tin },
              { label: "RDO Code", value: tp && tp.rdo },
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
          <F.Q item="Item 7" label="Taxpayer/Filer Type" req>
            <F.Cards
              field="filerType"
              cols={2}
              options={[
                { val: "single", title: "Single Proprietor" },
                { val: "prof", title: "Professional" },
                { val: "estate", title: "Estate" },
                { val: "trust", title: "Trust" },
              ]}
            />
          </F.Q>
        </>
      ),
    },
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
          {data.rateA !== "eight" && (
            <F.Q label="Method of deduction">
              <F.Cards
                field="methodA"
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
    },
    {
      part: "Part V",
      tab: "Income",
      title: "Income this quarter",
      desc: "Enter cumulative figures to date. We apply the 40% OSD (or your itemized amount) and the tax table.",
      render: () => (
        <>
          <F.Q label="Sales / Revenues / Receipts / Fees" req>
            <F.Money field="salesA" />
          </F.Q>
          <F.Q label="Less: Sales Returns, Allowances & Discounts">
            <F.Money field="returnsA" />
          </F.Q>
          <F.Q label="Less: Cost of Sales/Services">
            <F.Money field="cogsA" />
          </F.Q>
          {data.rateA !== "eight" && data.methodA === "itemized" && (
            <F.Q label="Allowable Itemized Deductions">
              <F.Money field="deductA" />
            </F.Q>
          )}
          <F.Q label="Add: Other Taxable Income / Non-Operating">
            <F.Money field="otherA" />
          </F.Q>
          <F.Q label="Add: Taxable Income from Previous Quarter(s)">
            <F.Money field="prevTaxableA" />
          </F.Q>
          <F.Result
            rows={[
              { label: "Net income", value: A.netIncome },
              { label: "Total taxable income to date", value: A.taxableCum },
              { label: "Tax due", value: A.taxDue, big: true },
            ]}
          />
        </>
      ),
    },
    {
      part: "Part V",
      tab: "Credits",
      title: "Tax credits & payments",
      desc: "Prior payments and withheld taxes reduce what you owe this quarter.",
      render: () => (
        <>
          <F.Q label="Prior Year’s Excess Credits">
            <F.Money field="excessA" />
          </F.Q>
          <F.Q label="Tax Payment(s) for Previous Quarter(s)">
            <F.Money field="prevPaidA" />
          </F.Q>
          <F.Q label="Creditable Tax Withheld per BIR Form 2307">
            <F.Money field="cwtA" />
          </F.Q>
          <F.Result
            rows={[
              { label: "Total credits", value: A.credits },
              { label: "Tax payable", value: A.payable, big: true },
            ]}
          />
        </>
      ),
    },
    {
      part: "Review",
      tab: "Review",
      title: "Review & generate",
      desc: "Summary of your 1701Q. Open the official form to print or save as PDF.",
      render: () => (
        <F.Result
          rows={[
            { label: "Taxpayer", value: name, peso: false },
            { label: "Year · Quarter", value: year + " · " + quarter, peso: false },
            { label: "Tax due", value: A.taxDue },
            { label: comp.aggregate < 0 ? "Overpayment" : "Amount payable", value: comp.aggregate, big: true },
          ]}
        />
      ),
    },
  ];

  return <GuidedShell steps={steps} onViewForm={onViewForm} onPrint={onPrint} />;
}

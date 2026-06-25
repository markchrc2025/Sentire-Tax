// Guided1701.tsx — guided wizard for 1701 (Annual ITR, mixed income).
// Ported from Guided1701 in bir-guided-returns.jsx (uses the shared kit).

import type { Comp1701 } from "../../lib/compute";
import type { GuidedProps } from "../formProps";
import { makeGuided, gName, GuidedShell, type GuidedStep } from "./guidedKit";

export function Guided1701({ tp, data, set, comp, onViewForm, onPrint }: GuidedProps<Comp1701>) {
  const F = makeGuided(data, set);
  const name = gName(tp);
  const A = comp.A;
  const year = (data.year as string) || "—";
  const rateA = data.rateA as string | undefined;

  const steps: GuidedStep[] = [
    {
      part: "Part I",
      tab: "Details",
      title: "Filing details",
      desc: "Which annual return is this? Your identity details come from the taxpayer profile.",
      render: () => (
        <>
          <F.ReadOnly
            items={[
              { label: "Taxpayer", value: name },
              { label: "TIN", value: tp && tp.tin },
              { label: "RDO Code", value: tp && tp.rdo },
              { label: "Address", value: tp ? [tp.address, tp.city, tp.zip].filter(Boolean).join(", ") : "" },
            ]}
          />
          <F.Q item="Item 1" label="For the Year" help="Taxable year covered (e.g. 2024)." req>
            <F.Txt field="year" ph="2024" maxw={140} />
          </F.Q>
          <F.Q item="Item 2" label="Is this an Amended Return?">
            <F.YesNo field="amended" />
          </F.Q>
          <F.Q item="Item 8" label="Taxpayer Type" req>
            <F.Cards
              field="taxpayerType"
              cols={2}
              options={[
                { val: "comp_biz", title: "Mixed Income", note: "Compensation + business/profession." },
                { val: "biz", title: "Business/Profession only" },
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
      title: "Tax rate & deduction method",
      desc: "How is your business income taxed? This drives the computation.",
      render: () => (
        <>
          <F.Q item="Item 19" label="Tax rate" req>
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
            <F.Q label="Method of deduction">
              <F.Cards
                field="methodA"
                cols={2}
                options={[
                  { val: "itemized", title: "Itemized Deduction", note: "Actual business expenses." },
                  { val: "osd", title: "OSD (40%)", note: "40% of net sales, no receipts needed." },
                ]}
              />
            </F.Q>
          )}
        </>
      ),
    },
    {
      part: "Part VI",
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
            <F.Q label="Allowable Itemized Deductions">
              <F.Money field="deductA" />
            </F.Q>
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
    {
      part: "Part VI",
      tab: "Credits",
      title: "Tax credits & payments",
      desc: "Taxes already paid or withheld reduce what you owe. Leave blank if none.",
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
          <F.Q item="Item 23" label="Portion allowed for 2nd installment" help="Up to 50% of tax due may be deferred to October 15.">
            <F.Money field="installA" />
          </F.Q>
          <F.Q label="Surcharge">
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
  ];

  return <GuidedShell steps={steps} onViewForm={onViewForm} onPrint={onPrint} />;
}

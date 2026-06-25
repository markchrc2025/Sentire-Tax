// Guided1702Q.tsx — guided wizard for 1702Q (uses the shared kit).
// Ported from Guided1702Q in bir-guided-corp.jsx.

import type { Comp1702Q } from "../../lib/compute";
import type { GuidedProps } from "../formProps";
import { GuidedShell, gName, makeGuided, type GuidedStep } from "./guidedKit";

export function Guided1702Q({ tp, data, set, comp, onViewForm, onPrint }: GuidedProps<Comp1702Q>) {
  const F = makeGuided(data, set);
  const name = gName(tp);
  const year = (data.year as string) || "—";
  const quarter = (data.quarter as string) || "—";
  const steps: GuidedStep[] = [
    {
      part: "Part I",
      tab: "Details",
      title: "Filing details",
      desc: "Which quarter is this corporate return for? Company details come from the profile.",
      render: () => (
        <>
          <F.ReadOnly
            items={[
              { label: "Registered Name", value: name },
              { label: "TIN", value: tp && tp.tin },
              { label: "RDO Code", value: tp && tp.rdo },
              { label: "Address", value: tp ? [tp.address, tp.city].filter(Boolean).join(", ") : "" },
            ]}
          />
          <F.Q item="Item 2" label="Year Ended (MM/YYYY)" req>
            <F.Txt field="year" ph="2024" maxw={140} />
          </F.Q>
          <F.Q item="Item 3" label="Quarter" req>
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
          <F.Q item="Item 12" label="Method of Deductions" req>
            <F.Cards
              field="method"
              cols={2}
              options={[
                { val: "itemized", title: "Itemized Deductions" },
                { val: "osd", title: "OSD (40% of Gross Income)" },
              ]}
            />
          </F.Q>
        </>
      ),
    },
    {
      part: "Schedule 2",
      tab: "Income",
      title: "Income this quarter (regular rate)",
      desc: "Enter cumulative figures to date. We compute gross income, the deduction, taxable income, and the tax due (higher of normal tax or 2% MCIT).",
      render: () => (
        <>
          <F.Q label="Sales / Receipts / Revenues / Fees" req>
            <F.Money field="s2_1" />
          </F.Q>
          <F.Q label="Less: Cost of Sales/Services">
            <F.Money field="s2_2" />
          </F.Q>
          <F.Q label="Add: Non-Operating and Other Taxable Income">
            <F.Money field="s2_4" />
          </F.Q>
          {data.method === "osd" ? (
            <F.Q label="Deductions (OSD 40% of gross income)">
              <F.Money ro value={comp.s2_6} />
            </F.Q>
          ) : (
            <F.Q label="Less: Deductions">
              <F.Money field="s2_6" />
            </F.Q>
          )}
          <F.Q label="Add: Taxable Income Previous Quarter(s)">
            <F.Money field="s2_8" />
          </F.Q>
          <F.Q label="Applicable Income Tax Rate (%)" help="25% standard; 20% for qualified small corporations.">
            <F.Txt field="rate" ph="25" maxw={100} />
          </F.Q>
          <F.Result
            rows={[
              { label: "Total gross income", value: comp.s2_5 },
              { label: "Total taxable income to date", value: comp.s2_9 },
              { label: "Normal tax", value: comp.s2_11 },
              { label: "MCIT 2%", value: comp.mcit },
              { label: comp.mcitApplies ? "Income tax due (MCIT)" : "Income tax due", value: comp.s2_13, big: true },
            ]}
          />
        </>
      ),
    },
    {
      part: "Part II",
      tab: "Payable",
      title: "Credits, penalties & total",
      desc: "Apply prior MCIT excess, tax credits/payments, and any penalties.",
      render: () => (
        <>
          <F.Q item="Item 15" label="Less: Unexpired Excess of Prior Year’s MCIT">
            <F.Money field="i15" />
          </F.Q>
          <F.Q item="Item 19" label="Total Tax Credits/Payments">
            <F.Money field="i19" />
          </F.Q>
          <F.Q label="Surcharge">
            <F.Money field="i21" />
          </F.Q>
          <F.Q label="Interest">
            <F.Money field="i22" />
          </F.Q>
          <F.Result
            rows={[
              { label: "Aggregate income tax due", value: comp.i18 },
              { label: "Less credits", value: comp.i19 },
              { label: comp.i25 < 0 ? "Overpayment" : "Total amount payable", value: comp.i25, big: true },
            ]}
          />
        </>
      ),
    },
    {
      part: "Review",
      tab: "Review",
      title: "Review & generate",
      desc: "Summary of your 1702Q. Open the official form to print or save as PDF.",
      render: () => (
        <F.Result
          rows={[
            { label: "Corporation", value: name, peso: false },
            { label: "Year · Quarter", value: year + " · " + quarter, peso: false },
            { label: "Taxable income to date", value: comp.s2_9 },
            { label: "Income tax due", value: comp.s2_13 },
            { label: comp.i25 < 0 ? "Overpayment" : "Total payable", value: comp.i25, big: true },
          ]}
        />
      ),
    },
  ];
  return <GuidedShell steps={steps} onViewForm={onViewForm} onPrint={onPrint} />;
}

// Guided2550Q.tsx — guided wizard for 2550Q (Quarterly VAT Return).
// Faithful port of `Guided2550Q` from bir-guided-returns.jsx (shared kit).

import type { Comp2550Q } from "../../lib/compute";
import type { GuidedProps } from "../formProps";
import { makeGuided, gName, GuidedShell, type GuidedStep } from "./guidedKit";

export function Guided2550Q({ tp, data, set, comp, onViewForm, onPrint }: GuidedProps<Comp2550Q>) {
  const F = makeGuided(data, set);
  const name = gName(tp);
  const steps: GuidedStep[] = [
    {
      part: "Part I",
      tab: "Details",
      title: "Filing details",
      desc: "Which VAT quarter is this? Identity details come from the profile.",
      render: () => (
        <>
          <F.ReadOnly
            items={[
              { label: "Taxpayer", value: name },
              { label: "TIN", value: tp && tp.tin },
              { label: "RDO Code", value: tp && tp.rdo },
              { label: "Classification", value: (data.classification as string) || (tp && tp.classification) },
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
                { val: "4th", title: "4th Quarter" },
              ]}
            />
          </F.Q>
          <F.Q item="Item 5" label="Is this an Amended Return?">
            <F.YesNo field="amended" />
          </F.Q>
        </>
      ),
    },
    {
      part: "Part IV",
      tab: "Sales",
      title: "Sales & output tax",
      desc: "Enter your sales for the quarter. Output VAT is computed at 12% of VATable sales.",
      render: () => (
        <>
          <F.Q item="Item 31" label="VATable Sales (exclusive of VAT)" req>
            <F.Money field="i31a" />
          </F.Q>
          <F.Q item="Item 32" label="Zero-Rated Sales">
            <F.Money field="i32a" />
          </F.Q>
          <F.Q item="Item 33" label="Exempt Sales">
            <F.Money field="i33a" />
          </F.Q>
          <F.Q item="Item 35" label="Less: Output VAT on Uncollected Receivables">
            <F.Money field="i35b" />
          </F.Q>
          <F.Q
            item="Item 36"
            label="Add: Output VAT on Recovered Uncollected Receivables Previously Deducted"
          >
            <F.Money field="i36b" />
          </F.Q>
          <F.Result
            rows={[
              { label: "Total sales", value: comp.i34a },
              { label: "Output tax (12%)", value: comp.i34b },
              { label: "Total adjusted output tax (Item 37)", value: comp.i37, big: true },
            ]}
          />
        </>
      ),
    },
    {
      part: "Part IV",
      tab: "Input tax",
      title: "Input tax (purchases)",
      desc: "Enter the VAT on your purchases — this credits against your output tax.",
      render: () => (
        <>
          <F.Q item="Item 38" label="Input Tax Carried Over from Previous Quarter">
            <F.Money field="i38" />
          </F.Q>
          <F.Q
            item="Item 39"
            label="Input Tax Deferred on Capital Goods >P1M from Previous Quarter"
            help="From Part V – Schedule 1, Column E. Enter here if you are not itemizing the schedule."
          >
            <F.Money field="i39" />
          </F.Q>
          <F.Q item="Item 40" label="Transitional Input Tax">
            <F.Money field="i40" />
          </F.Q>
          <F.Q item="Item 41" label="Presumptive Input Tax">
            <F.Money field="i41" />
          </F.Q>
          <F.Q item="Item 42" label="Other Input Tax (specify)">
            <F.Txt field="i42label" ph="Specify other input tax" />
          </F.Q>
          <F.Q item="Item 42" label="Other Input Tax — amount">
            <F.Money field="i42" />
          </F.Q>
          <F.Q item="Item 44B" label="Input Tax on Domestic Purchases (this quarter)">
            <F.Money field="i44b" />
          </F.Q>
          <F.Q item="Item 46B" label="Input Tax on Importations">
            <F.Money field="i46b" />
          </F.Q>
          <F.Result
            rows={[
              { label: "Total available input tax", value: comp.i51 },
              { label: "Net VAT payable", value: comp.i61, big: true },
            ]}
          />
        </>
      ),
    },
    {
      part: "Part II",
      tab: "Payable",
      title: "Credits, penalties & total",
      desc: "Apply any VAT withheld/advance payments and penalties.",
      render: () => (
        <>
          <F.Q
            item="Item 16"
            label="Creditable VAT Withheld"
            help="From Part V – Schedule 3, Column D. Enter here if you are not itemizing the schedule."
          >
            <F.Money field="i16" />
          </F.Q>
          <F.Q
            item="Item 17"
            label="Advance VAT Payments"
            help="From Part V – Schedule 4. Enter here if you are not itemizing the schedule."
          >
            <F.Money field="i17" />
          </F.Q>
          <F.Q item="Item 18" label="VAT paid in return previously filed, if this is an amended return">
            <F.Money field="i18" />
          </F.Q>
          <F.Q item="Item 19" label="Other Credits/Payment (specify)">
            <F.Txt field="i19label" ph="Specify other credits/payment" />
          </F.Q>
          <F.Q item="Item 19" label="Other Credits/Payment — amount">
            <F.Money field="i19" />
          </F.Q>
          <F.Q item="Item 22" label="Surcharge">
            <F.Money field="i22" />
          </F.Q>
          <F.Q item="Item 23" label="Interest">
            <F.Money field="i23" />
          </F.Q>
          <F.Q item="Item 24" label="Compromise">
            <F.Money field="i24" />
          </F.Q>
          <F.Result
            rows={[
              { label: "Net VAT payable", value: comp.i15 },
              { label: "Less credits", value: comp.i20 },
              { label: comp.i26 < 0 ? "Excess credits" : "Total amount payable", value: comp.i26, big: true },
            ]}
          />
        </>
      ),
    },
    {
      part: "Review",
      tab: "Review",
      title: "Review & generate",
      desc: "Summary of your 2550Q. Open the official form to print or save as PDF.",
      render: () => (
        <F.Result
          rows={[
            { label: "Taxpayer", value: name, peso: false },
            {
              label: "Year · Quarter",
              value: ((data.year as string) || "—") + " · " + ((data.quarter as string) || "—"),
              peso: false,
            },
            { label: "Output tax", value: comp.i34b },
            { label: "Allowable input tax", value: comp.i60 },
            { label: comp.i26 < 0 ? "Excess credits" : "Total payable", value: comp.i26, big: true },
          ]}
        />
      ),
    },
  ];
  return <GuidedShell steps={steps} onViewForm={onViewForm} onPrint={onPrint} />;
}

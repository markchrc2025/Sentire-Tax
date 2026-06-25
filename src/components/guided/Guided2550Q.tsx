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
          <F.Result
            rows={[
              { label: "Total sales", value: comp.i34a },
              { label: "Output tax (12%)", value: comp.i31b, big: true },
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
          <F.Q item="Item 16" label="Creditable VAT Withheld">
            <F.Money field="i16" />
          </F.Q>
          <F.Q item="Item 17" label="Advance VAT Payments">
            <F.Money field="i17" />
          </F.Q>
          <F.Q label="Surcharge">
            <F.Money field="i22" />
          </F.Q>
          <F.Q label="Interest">
            <F.Money field="i23" />
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

// Guided2316.tsx — guided wizard for 2316 (Certificate of Compensation Payment / Tax Withheld).
// Ported from Guided2316 in bir-guided-certs.jsx.

import type { Comp2316 } from "../../lib/compute";
import type { GuidedProps } from "../formProps";
import { makeGuided, gName, GuidedShell, type GuidedStep } from "./guidedKit";

export function Guided2316({ tp, data, set, comp, onViewForm, onPrint }: GuidedProps<Comp2316>) {
  const F = makeGuided(data, set);
  const name = gName(tp);

  const steps: GuidedStep[] = [
    {
      part: "Part I",
      tab: "Employee",
      title: "Employee & period",
      desc: "This certificate reports an employee's compensation and tax withheld. Employee details come from the profile.",
      render: () => (
        <>
          <F.ReadOnly
            items={[
              { label: "Employee", value: name },
              { label: "TIN", value: tp && tp.tin },
              { label: "RDO Code", value: tp && tp.rdo },
              { label: "Address", value: tp ? [tp.address, tp.city].filter(Boolean).join(", ") : "" },
            ]}
          />
          <F.Q item="Item 1" label="For the Year (YYYY)" req>
            <F.Txt field="year" ph="2024" maxw={140} />
          </F.Q>
          <F.Q item="Item 2" label="Period — From (MM/DD)">
            <F.Txt field="from" ph="01/01" maxw={140} />
          </F.Q>
          <F.Q label="Period — To (MM/DD)">
            <F.Txt field="to" ph="12/31" maxw={140} />
          </F.Q>
        </>
      ),
    },
    {
      part: "Part II",
      tab: "Employer",
      title: "Employer information",
      desc: "Details of the present employer issuing this certificate.",
      render: () => (
        <>
          <F.Q item="Item 13" label="Employer’s Name" req>
            <F.Txt field="empName" up />
          </F.Q>
          <F.Q item="Item 12" label="Employer’s TIN">
            <F.Txt field="empTin" ph="000-000-000-000" maxw={220} />
          </F.Q>
          <F.Q item="Item 14" label="Employer’s Registered Address">
            <F.Txt field="empAddr" up />
          </F.Q>
        </>
      ),
    },
    {
      part: "Part IV-B",
      tab: "Non-taxable",
      title: "Non-taxable / exempt compensation",
      desc: "Mandatory contributions, the ₱90,000 13th-month cap, de minimis benefits, and MWE pay are exempt.",
      render: () => (
        <>
          <F.Q label="Basic Salary (incl. exempt ₱250,000 & below / SMW)">
            <F.Money field="i29" />
          </F.Q>
          <F.Q label="13th Month Pay & Other Benefits (max ₱90,000)">
            <F.Money field="i34" />
          </F.Q>
          <F.Q label="De Minimis Benefits">
            <F.Money field="i35" />
          </F.Q>
          <F.Q label="SSS, GSIS, PHIC, Pag-IBIG & Union Dues">
            <F.Money field="i36" />
          </F.Q>
          <F.Q label="Salaries & Other Forms of Compensation">
            <F.Money field="i37" />
          </F.Q>
          <F.Result rows={[{ label: "Total non-taxable / exempt (Item 38)", value: comp.i38, big: true }]} />
        </>
      ),
    },
    {
      part: "Part IV-B",
      tab: "Taxable",
      title: "Taxable compensation",
      desc: "Regular taxable pay components. We total these and compute the tax due using the graduated table.",
      render: () => (
        <>
          <F.Q label="Basic Salary">
            <F.Money field="i39" />
          </F.Q>
          <F.Q label="Representation">
            <F.Money field="i40" />
          </F.Q>
          <F.Q label="Transportation">
            <F.Money field="i41" />
          </F.Q>
          <F.Q label="Cost of Living Allowance (COLA)">
            <F.Money field="i42" />
          </F.Q>
          <F.Q label="Taxable 13th Month & Other Benefits">
            <F.Money field="i50" />
          </F.Q>
          <F.Q label="Others / Supplementary">
            <F.Money field="i51" />
          </F.Q>
          <F.Result
            rows={[
              { label: "Total taxable compensation (Item 26)", value: comp.i26 },
              { label: "Gross taxable income (Item 23)", value: comp.i23 },
              { label: "Tax due (Item 24)", value: comp.i24, big: true },
            ]}
          />
        </>
      ),
    },
    {
      part: "Part IV-A",
      tab: "Withheld",
      title: "Taxes withheld",
      desc: "Tax actually withheld from the employee. We compare it to tax due to show any balance.",
      render: () => (
        <>
          <F.Q item="Item 22" label="Add: Taxable Compensation from Previous Employer">
            <F.Money field="i22" />
          </F.Q>
          <F.Q item="Item 25A" label="Taxes Withheld — Present Employer">
            <F.Money field="i25A" />
          </F.Q>
          <F.Q item="Item 25B" label="Taxes Withheld — Previous Employer">
            <F.Money field="i25B" />
          </F.Q>
          <F.Result
            rows={[
              { label: "Tax due", value: comp.i24 },
              { label: "Total taxes withheld (Item 28)", value: comp.i28 },
              {
                label: comp.i24 > comp.i28 ? "Tax still due" : "Over-withheld / refund",
                value: Math.abs(comp.i24 - comp.i28),
                big: true,
              },
            ]}
          />
        </>
      ),
    },
    {
      part: "Review",
      tab: "Review",
      title: "Review & generate",
      desc: "Summary of this 2316 certificate. Open the official form to print or save as PDF.",
      render: () => (
        <F.Result
          rows={[
            { label: "Employee", value: name, peso: false },
            { label: "Employer", value: (data.empName as string) || "—", peso: false },
            { label: "Year", value: (data.year as string) || "—", peso: false },
            { label: "Gross taxable income", value: comp.i23 },
            { label: "Tax due", value: comp.i24 },
            { label: "Total taxes withheld", value: comp.i28, big: true },
          ]}
        />
      ),
    },
  ];

  return <GuidedShell steps={steps} onViewForm={onViewForm} onPrint={onPrint} />;
}

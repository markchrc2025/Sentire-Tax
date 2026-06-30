// Guided2316.tsx — guided wizard for 2316 (Certificate of Compensation Payment / Tax Withheld).
// Mirrors the faithful Form2316 view; field keys are shared with Form2316 + compute2316.

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
          <F.Q item="Item 6B" label="Local Home Address">
            <F.Txt field="empLocalAddr" up />
          </F.Q>
          <F.Q label="Item 6C — ZIP Code">
            <F.Txt field="empLocalZip" maxw={140} />
          </F.Q>
          <F.Q item="Item 6D" label="Foreign Address (if any)">
            <F.Txt field="empForeignAddr" up />
          </F.Q>
          <F.Q label="Minimum Wage Earner (MWE)?" help="MWE compensation is exempt from withholding tax and not subject to income tax.">
            <F.YesNo field="mwe" />
          </F.Q>
          <F.Q item="Item 9" label="Statutory Minimum Wage rate per day">
            <F.Txt field="smwDay" maxw={180} />
          </F.Q>
          <F.Q item="Item 10" label="Statutory Minimum Wage rate per month">
            <F.Txt field="smwMonth" maxw={180} />
          </F.Q>
        </>
      ),
    },
    {
      part: "Part II",
      tab: "Employer",
      title: "Present employer",
      desc: "Details of the present employer issuing this certificate.",
      render: () => (
        <>
          <F.Q item="Item 11" label="Type of Employer">
            <F.Seg
              field="empType"
              options={[
                { val: "main", label: "Main Employer" },
                { val: "secondary", label: "Secondary Employer" },
              ]}
            />
          </F.Q>
          <F.Q item="Item 13" label="Employer’s Name" req>
            <F.Txt field="empName" up />
          </F.Q>
          <F.Q item="Item 12" label="Employer’s TIN">
            <F.Txt field="empTin" ph="000-000-000-000" maxw={220} />
          </F.Q>
          <F.Q item="Item 14" label="Employer’s Registered Address">
            <F.Txt field="empAddr" up />
          </F.Q>
          <F.Q label="Item 14A — ZIP Code">
            <F.Txt field="empZip" maxw={140} />
          </F.Q>
        </>
      ),
    },
    {
      part: "Part III",
      tab: "Previous",
      title: "Previous employer",
      desc: "If the employee worked for another employer in the same year, enter those details. Leave blank if not applicable.",
      render: () => (
        <>
          <F.Q item="Item 15" label="Type of Employer">
            <F.Seg
              field="prevEmpType"
              options={[
                { val: "main", label: "Main Employer" },
                { val: "secondary", label: "Secondary Employer" },
              ]}
            />
          </F.Q>
          <F.Q item="Item 17" label="Previous Employer’s Name">
            <F.Txt field="prevEmpName" up />
          </F.Q>
          <F.Q item="Item 16" label="Previous Employer’s TIN">
            <F.Txt field="prevEmpTin" ph="000-000-000-000" maxw={220} />
          </F.Q>
          <F.Q item="Item 18" label="Previous Employer’s Registered Address">
            <F.Txt field="prevEmpAddr" up />
          </F.Q>
          <F.Q label="Item 18A — ZIP Code">
            <F.Txt field="prevEmpZip" maxw={140} />
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
          <F.Q label="Item 29 — Basic Salary (incl. exempt ₱250,000 & below / SMW)">
            <F.Money field="i29" />
          </F.Q>
          <F.Q label="Item 30 — Holiday Pay (MWE)">
            <F.Money field="i30" />
          </F.Q>
          <F.Q label="Item 31 — Overtime Pay (MWE)">
            <F.Money field="i31" />
          </F.Q>
          <F.Q label="Item 32 — Night Shift Differential (MWE)">
            <F.Money field="i32" />
          </F.Q>
          <F.Q label="Item 33 — Hazard Pay (MWE)">
            <F.Money field="i33" />
          </F.Q>
          <F.Q label="Item 34 — 13th Month Pay & Other Benefits (max ₱90,000)">
            <F.Money field="i34" />
          </F.Q>
          <F.Q label="Item 35 — De Minimis Benefits">
            <F.Money field="i35" />
          </F.Q>
          <F.Q label="Item 36 — SSS, GSIS, PHIC, Pag-IBIG & Union Dues">
            <F.Money field="i36" />
          </F.Q>
          <F.Q label="Item 37 — Salaries & Other Forms of Compensation">
            <F.Money field="i37" />
          </F.Q>
          <F.Result rows={[{ label: "Total non-taxable / exempt (Item 38)", value: comp.i38, big: true }]} />
        </>
      ),
    },
    {
      part: "Part IV-B",
      tab: "Taxable",
      title: "Taxable compensation (Regular)",
      desc: "Regular taxable pay components, items 39–44.",
      render: () => (
        <>
          <F.Q label="Item 39 — Basic Salary">
            <F.Money field="i39" />
          </F.Q>
          <F.Q label="Item 40 — Representation">
            <F.Money field="i40" />
          </F.Q>
          <F.Q label="Item 41 — Transportation">
            <F.Money field="i41" />
          </F.Q>
          <F.Q label="Item 42 — Cost of Living Allowance (COLA)">
            <F.Money field="i42" />
          </F.Q>
          <F.Q label="Item 43 — Fixed Housing Allowance">
            <F.Money field="i43" />
          </F.Q>
          <F.Q item="Item 44A" label="Others (specify) — description">
            <F.Txt field="i44Adesc" up />
          </F.Q>
          <F.Q label="Item 44A — amount">
            <F.Money field="i44A" />
          </F.Q>
          <F.Q item="Item 44B" label="Others (specify) — description">
            <F.Txt field="i44Bdesc" up />
          </F.Q>
          <F.Q label="Item 44B — amount">
            <F.Money field="i44B" />
          </F.Q>
        </>
      ),
    },
    {
      part: "Part IV-B",
      tab: "Supplementary",
      title: "Taxable compensation (Supplementary)",
      desc: "Supplementary taxable pay, items 45–51. We total these with the regular lines and compute tax due using the graduated table.",
      render: () => (
        <>
          <F.Q label="Item 45 — Commission">
            <F.Money field="i45" />
          </F.Q>
          <F.Q label="Item 46 — Profit Sharing">
            <F.Money field="i46" />
          </F.Q>
          <F.Q label="Item 47 — Fees Including Director’s Fees">
            <F.Money field="i47" />
          </F.Q>
          <F.Q label="Item 48 — Taxable 13th Month Benefits">
            <F.Money field="i48" />
          </F.Q>
          <F.Q label="Item 49 — Hazard Pay">
            <F.Money field="i49" />
          </F.Q>
          <F.Q label="Item 50 — Overtime Pay">
            <F.Money field="i50" />
          </F.Q>
          <F.Q item="Item 51A" label="Others (specify) — description">
            <F.Txt field="i51Adesc" up />
          </F.Q>
          <F.Q label="Item 51A — amount">
            <F.Money field="i51A" />
          </F.Q>
          <F.Q item="Item 51B" label="Others (specify) — description">
            <F.Txt field="i51Bdesc" up />
          </F.Q>
          <F.Q label="Item 51B — amount">
            <F.Money field="i51B" />
          </F.Q>
          <F.Result
            rows={[
              { label: "Total taxable compensation, present (Item 52)", value: comp.i52 },
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
          <F.Q item="Item 27" label="5% Tax Credit (PERA Act of 2008)">
            <F.Money field="i27" />
          </F.Q>
          <F.Result
            rows={[
              { label: "Tax due (Item 24)", value: comp.i24 },
              { label: "Total taxes withheld as adjusted (Item 26)", value: comp.i26 },
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
      part: "Conforme",
      tab: "Conforme",
      title: "Conforme & signatures",
      desc: "Employee acknowledgement details (items 53–56) for the conforme block.",
      render: () => (
        <>
          <F.Q item="Item 53" label="CTC / Valid ID No. of Employee">
            <F.Txt field="empeeCtcNo" maxw={260} />
          </F.Q>
          <F.Q item="Item 54" label="Place of Issue">
            <F.Txt field="empeeCtcPlace" up />
          </F.Q>
          <F.Q item="Item 55" label="Amount paid, if CTC">
            <F.Txt field="empeeCtcAmt" maxw={180} />
          </F.Q>
          <F.Q item="Item 56" label="Date of Issue (MM/DD/YYYY)">
            <F.Txt field="empeeCtcDate" ph="MM/DD/YYYY" maxw={180} />
          </F.Q>
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

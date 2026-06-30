// Guided1702RT.tsx — guided wizard for 1702-RT (Annual Corporate ITR, Regular Rate).
// Collects every user-entered field: background (ATC, treaty, attachments,
// signatory titles/TINs), income & deductions, the credit items (incl. Excess
// MCIT and NOLCO), and penalties — feeding the shared compute1702RT engine.

import type { Comp1702RT } from "../../lib/compute";
import type { GuidedProps } from "../formProps";
import { GuidedShell, gName, makeGuided, type GuidedStep } from "./guidedKit";

export function Guided1702RT({ tp, data, set, comp, onViewForm, onPrint }: GuidedProps<Comp1702RT>) {
  const F = makeGuided(data, set);
  const name = gName(tp);

  const steps: GuidedStep[] = [
    {
      part: "Part I",
      tab: "Details",
      title: "Filing details",
      desc: "Which annual corporate return is this? The company's details come from the taxpayer profile.",
      render: () => (
        <>
          <F.ReadOnly
            items={[
              { label: "Registered Name", value: name },
              { label: "TIN", value: tp && tp.tin },
              { label: "RDO Code", value: tp && tp.rdo },
              { label: "Address", value: tp ? [tp.address, tp.city, tp.zip].filter(Boolean).join(", ") : "" },
            ]}
          />
          <F.Q item="Item 2" label="Year Ended (MM/YYYY)" req>
            <F.Txt field="year" ph="2024" maxw={140} />
          </F.Q>
          <F.Q item="Item 3" label="Is this an Amended Return?">
            <F.YesNo field="amended" />
          </F.Q>
          <F.Q item="Item 4" label="Is this a Short Period Return?">
            <F.YesNo field="shortPeriod" />
          </F.Q>
          <F.Q item="Item 5" label="Alphanumeric Tax Code (ATC)" help="e.g. IC 055 — Minimum Corporate Income Tax (MCIT).">
            <F.Txt field="atc" ph="IC 055" maxw={160} />
          </F.Q>
          <F.Q label="Are you availing of tax relief under Special Law / International Tax Treaty?">
            <F.YesNo field="treaty" />
          </F.Q>
          {data.treaty === "yes" && (
            <F.Q label="If yes, specify">
              <F.Txt field="treatySpecify" />
            </F.Q>
          )}
          <F.Q item="Item 13" label="Method of Deductions" req>
            <F.Cards
              field="method"
              cols={2}
              options={[
                { val: "itemized", title: "Itemized Deductions", note: "Actual business expenses [Sec. 34(A-J)]." },
                { val: "osd", title: "OSD (40% of Gross Income)", note: "No receipts needed [Sec. 34(L)]." },
              ]}
            />
          </F.Q>
        </>
      ),
    },
    {
      part: "Part IV",
      tab: "Income",
      title: "Income & deductions",
      desc: "Enter the company's sales and costs. We compute gross income, the chosen deduction, and net taxable income.",
      render: () => (
        <>
          <F.Q label="Sales / Receipts / Revenues / Fees" req>
            <F.Money field="i27" />
          </F.Q>
          <F.Q label="Less: Sales Returns, Allowances & Discounts">
            <F.Money field="i28" />
          </F.Q>
          <F.Q label="Less: Cost of Sales/Services">
            <F.Money field="i30" />
          </F.Q>
          <F.Q label="Add: Other Taxable Income Not Subject to Final Tax">
            <F.Money field="i32" />
          </F.Q>
          {data.method === "osd" ? (
            <F.Q label="Optional Standard Deduction" help="Auto-computed as 40% of gross income.">
              <F.Money ro value={comp.i38} />
            </F.Q>
          ) : (
            <>
              <F.Q label="Ordinary Allowable Itemized Deductions" help="Schedule I Item 18 total (or enter the schedule detail in the official form).">
                <F.Money field="i34" />
              </F.Q>
              <F.Q label="Special Allowable Itemized Deductions" help="Schedule II Item 5 total.">
                <F.Money field="i35" />
              </F.Q>
              <F.Q label="NOLCO (Net Operating Loss Carry-Over)" help="Schedule III Item 8 total.">
                <F.Money field="i36" />
              </F.Q>
            </>
          )}
          <F.Result
            rows={[
              { label: "Gross income (Item 33)", value: comp.i33 },
              { label: "Net taxable income (Item 39)", value: comp.i39 },
            ]}
          />
        </>
      ),
    },
    {
      part: "Part IV",
      tab: "Tax due",
      title: "Tax rate & MCIT",
      desc: "The regular corporate rate is 25% (20% for small corporations). Tax due is the higher of the normal tax or the 2% Minimum Corporate Income Tax (MCIT).",
      render: () => (
        <>
          <F.Q
            item="Item 40"
            label="Applicable Income Tax Rate (%)"
            help="25% standard; 20% if net taxable income ≤ ₱5M and total assets ≤ ₱100M."
          >
            <F.Txt field="rate" ph="25" maxw={100} />
          </F.Q>
          <F.Result
            rows={[
              { label: "Income tax (normal) — Item 41", value: comp.i41 },
              { label: "MCIT 2% — Item 42", value: comp.i42 },
              { label: comp.mcitApplies ? "Tax due (MCIT applies)" : "Tax due (normal)", value: comp.i43, big: true },
            ]}
          />
          {comp.mcitApplies && (
            <div className="g-overpay" style={{ background: "#fdf6ec", color: "#b07a2e" }}>
              MCIT exceeds the normal tax, so the 2% MCIT is used as your tax due.
            </div>
          )}
        </>
      ),
    },
    {
      part: "Part IV",
      tab: "Credits",
      title: "Tax credits & payments",
      desc: "Quarterly payments and creditable withholding reduce what you still owe.",
      render: () => (
        <>
          <F.Q label="Prior Year’s Excess Credits other than MCIT">
            <F.Money field="i44" />
          </F.Q>
          <F.Q label="Income Tax Payment under MCIT from Previous Quarters">
            <F.Money field="i45" />
          </F.Q>
          <F.Q label="Income Tax Payments from Previous Quarters (Regular)">
            <F.Money field="i46" />
          </F.Q>
          <F.Q label="Excess MCIT Applied this Current Taxable Year" help="Schedule IV Item 4 total (or enter the schedule detail in the official form).">
            <F.Money field="i47" />
          </F.Q>
          <F.Q label="Creditable Tax Withheld from Previous Quarters (2307)">
            <F.Money field="i48" />
          </F.Q>
          <F.Q label="Creditable Tax Withheld for the 4th Quarter (2307)">
            <F.Money field="i49" />
          </F.Q>
          <F.Q label="Foreign Tax Credits, if applicable">
            <F.Money field="i50" />
          </F.Q>
          <F.Q label="Tax Paid in Return Previously Filed, if Amended">
            <F.Money field="i51" />
          </F.Q>
          <F.Q label="Special Tax Credits">
            <F.Money field="i52" />
          </F.Q>
          <F.Result
            rows={[
              { label: "Total tax credits (Item 55)", value: comp.i55 },
              { label: "Net tax payable (Item 56)", value: comp.i56, big: true },
            ]}
          />
        </>
      ),
    },
    {
      part: "Part II",
      tab: "Payable",
      title: "Penalties & amount payable",
      desc: "Add penalties only if filing late.",
      render: () => (
        <>
          <F.Q label="Surcharge">
            <F.Money field="i17" />
          </F.Q>
          <F.Q label="Interest">
            <F.Money field="i18" />
          </F.Q>
          <F.Q label="Compromise">
            <F.Money field="i19" />
          </F.Q>
          <F.Result
            rows={[
              { label: "Net tax payable", value: comp.i16 },
              { label: "Total penalties", value: comp.i20 },
              { label: comp.i21 < 0 ? "Overpayment" : "Total amount payable", value: comp.i21, big: true },
            ]}
          />
        </>
      ),
    },
    {
      part: "Sign",
      tab: "Signatories",
      title: "Signatories & attachments",
      desc: "The annual corporate return is signed by two officers. Indicate each signatory's title and TIN.",
      render: () => (
        <>
          <F.Q item="Item 22" label="Number of Attachments">
            <F.Txt field="attachments" ph="0" maxw={120} />
          </F.Q>
          <F.Q label="President / Principal Officer — Title of Signatory">
            <F.Txt field="presTitle" ph="PRESIDENT" />
          </F.Q>
          <F.Q label="President / Principal Officer — TIN">
            <F.Txt field="presTin" />
          </F.Q>
          <F.Q label="Treasurer / Assistant Treasurer — Name">
            <F.Txt field="treasurer" />
          </F.Q>
          <F.Q label="Treasurer / Assistant Treasurer — Title of Signatory">
            <F.Txt field="treasTitle" ph="TREASURER" />
          </F.Q>
          <F.Q label="Treasurer / Assistant Treasurer — TIN">
            <F.Txt field="treasTin" />
          </F.Q>
        </>
      ),
    },
    {
      part: "Review",
      tab: "Review",
      title: "Review & generate",
      desc: "Summary of your 1702-RT. Open the official form to print or save as PDF.",
      render: () => (
        <F.Result
          rows={[
            { label: "Corporation", value: name, peso: false },
            {
              label: "Year · Method",
              value: ((data.year as string) || "—") + " · " + (data.method === "osd" ? "OSD" : "Itemized"),
              peso: false,
            },
            { label: "Net taxable income", value: comp.i39 },
            { label: "Tax due", value: comp.i43 },
            { label: comp.i21 < 0 ? "Overpayment" : "Total payable", value: comp.i21, big: true },
          ]}
        />
      ),
    },
  ];

  return <GuidedShell steps={steps} onViewForm={onViewForm} onPrint={onPrint} />;
}

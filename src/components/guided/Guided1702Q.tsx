// Guided1702Q.tsx — guided wizard for 1702Q (uses the shared kit).
// Collects: filing details + ATC + treaty, regular-rate income (Schedule 2),
// special/exempt income (Schedule 1), MCIT detail (Schedule 3), tax
// credits/payments (Schedule 4), penalties, attachments + signatories, review.

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
          <F.Q item="Item 5" label="Alphanumeric Tax Code (ATC)" help="e.g. IC 055 (MCIT) or IC 010 (in general). See the rate table on page 3 of the form.">
            <F.Txt field="atc" ph="IC 055" up maxw={160} />
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
          <F.Q item="Item 13" label="Availing of tax relief under Special Law/International Tax Treaty?">
            <F.YesNo field="treaty" />
          </F.Q>
          {data.treaty === "yes" && (
            <F.Q item="Item 13A" label="If yes, specify">
              <F.Txt field="treatySpecify" />
            </F.Q>
          )}
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
      part: "Schedule 3",
      tab: "MCIT",
      title: "MCIT — gross income per quarter",
      desc: "For cumulative MCIT, enter the regular-rate gross income for each elapsed quarter. Leave blank and we use this quarter's gross income.",
      render: () => (
        <>
          <F.Q item="Item 1" label="Gross Income Regular/Normal Rate – 1st Quarter">
            <F.Money field="sch3_1" />
          </F.Q>
          <F.Q item="Item 2" label="Gross Income Regular/Normal Rate – 2nd Quarter">
            <F.Money field="sch3_2" />
          </F.Q>
          <F.Q item="Item 3" label="Gross Income Regular/Normal Rate – 3rd Quarter">
            <F.Money field="sch3_3" />
          </F.Q>
          <F.Result
            rows={[
              { label: "Total gross income", value: comp.sch3_4 },
              { label: "MCIT (2%)", value: comp.sch3_6, big: true },
            ]}
          />
        </>
      ),
    },
    {
      part: "Schedule 1",
      tab: "Special",
      title: "Special / exempt-rate income (optional)",
      desc: "Only if you have income subject to a special or preferential rate, or exempt income. Skip if none — leave blank.",
      render: () => (
        <>
          <F.Q label="SPECIAL — Sales / Receipts / Revenues / Fees">
            <F.Money field="sch1_1B" />
          </F.Q>
          <F.Q label="SPECIAL — Less: Cost of Sales/Services">
            <F.Money field="sch1_2B" />
          </F.Q>
          <F.Q label="SPECIAL — Add: Non-Operating and Other Taxable Income">
            <F.Money field="sch1_4B" />
          </F.Q>
          <F.Q label="SPECIAL — Less: Deductions">
            <F.Money field="sch1_6B" />
          </F.Q>
          <F.Q label="SPECIAL — Add: Taxable Income Previous Quarter(s)">
            <F.Money field="sch1_8B" />
          </F.Q>
          <F.Q label="SPECIAL — Applicable Income Tax Rate (%)" help="The preferential rate for this special income (e.g. 10%).">
            <F.Txt field="sch1Rate" ph="0" maxw={100} />
          </F.Q>
          <F.Q label="EXEMPT — Sales/Receipts/Revenues/Fees (taxed at 0%; informational)">
            <F.Money field="sch1_1A" />
          </F.Q>
          <F.Result
            rows={[
              { label: "Special — taxable income to date", value: comp.sch1_9B },
              { label: "Special-rate net income tax due (→ Item 17)", value: comp.sch1_13, big: true },
            ]}
          />
        </>
      ),
    },
    {
      part: "Schedule 4",
      tab: "Credits",
      title: "Tax credits & payments",
      desc: "Enter prior credits, quarterly payments, creditable withholding, and any other credits. We total them into Part II Item 19.",
      render: () => (
        <>
          <F.Q item="Item 1" label="Prior Year’s Excess Credits">
            <F.Money field="sch4_1" />
          </F.Q>
          <F.Q item="Item 2" label="Tax payment/s for previous quarter/s (other than MCIT)">
            <F.Money field="sch4_2" />
          </F.Q>
          <F.Q item="Item 3" label="MCIT payment/s for previous quarter/s">
            <F.Money field="sch4_3" />
          </F.Q>
          <F.Q item="Item 4" label="Creditable Tax Withheld for previous quarter/s">
            <F.Money field="sch4_4" />
          </F.Q>
          <F.Q item="Item 5" label="Creditable Tax Withheld per BIR Form 2307 for this quarter">
            <F.Money field="sch4_5" />
          </F.Q>
          <F.Q item="Item 6" label="Tax paid in previously-filed return (if amended)">
            <F.Money field="sch4_6" />
          </F.Q>
          <F.Q item="Item 6a" label="Other Tax Credits/Payments">
            <F.Money field="sch4_6a" />
          </F.Q>
          <F.Q item="Item 6b" label="Other Tax Credits/Payments">
            <F.Money field="sch4_6b" />
          </F.Q>
          <F.Result rows={[{ label: "Total tax credits/payments (→ Item 19)", value: comp.sch4_7, big: true }]} />
        </>
      ),
    },
    {
      part: "Part II",
      tab: "Payable",
      title: "Prior MCIT, penalties & total",
      desc: "Apply any prior MCIT excess and penalties. Credits come from Schedule 4 and the special rate from Schedule 1.",
      render: () => (
        <>
          <F.Q item="Item 15" label="Less: Unexpired Excess of Prior Year’s MCIT">
            <F.Money field="i15" />
          </F.Q>
          <F.Q label="Surcharge">
            <F.Money field="i21" />
          </F.Q>
          <F.Q label="Interest">
            <F.Money field="i22" />
          </F.Q>
          <F.Q label="Compromise">
            <F.Money field="i23" />
          </F.Q>
          <F.Result
            rows={[
              { label: "Income tax due — regular (Item 16)", value: comp.i16 },
              { label: "Add special rate (Item 17)", value: comp.i17 },
              { label: "Aggregate income tax due (Item 18)", value: comp.i18 },
              { label: "Less credits (Item 19)", value: comp.i19 },
              { label: "Total penalties (Item 24)", value: comp.i24 },
              { label: comp.i25 < 0 ? "Overpayment" : "Total amount payable", value: comp.i25, big: true },
            ]}
          />
        </>
      ),
    },
    {
      part: "Signatories",
      tab: "Sign",
      title: "Attachments & signatories",
      desc: "Number of attached documents and the officers signing the return.",
      render: () => (
        <>
          <F.Q item="Item 26" label="Number of Attachments">
            <F.Txt field="attachments" ph="0" maxw={120} />
          </F.Q>
          <F.Q label="Treasurer / Assistant Treasurer — Printed Name">
            <F.Txt field="treasurer" />
          </F.Q>
          <F.Q label="President / Principal Officer — Title of Signatory">
            <F.Txt field="presTitle" />
          </F.Q>
          <F.Q label="President / Principal Officer — TIN">
            <F.Txt field="presTin" />
          </F.Q>
          <F.Q label="Treasurer / Assistant Treasurer — Title of Signatory">
            <F.Txt field="treasTitle" />
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

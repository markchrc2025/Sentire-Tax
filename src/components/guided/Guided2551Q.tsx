// Guided2551Q.tsx — guided wizard for 2551Q (Quarterly Percentage Tax Return).
// Faithful port of Guided2551Q from bir-guided-returns.jsx (shared kit).

import type { Comp2551Q } from "../../lib/compute";
import type { Row2551Q } from "../../types";
import type { GuidedProps } from "../formProps";
import { GuidedShell, gName, makeGuided, type GuidedStep } from "./guidedKit";

const ATC: Array<[string, string, string]> = [
  ["PT010", "Persons exempt from VAT (Sec. 116)", "3"],
  ["PT040", "Domestic carriers & keepers of garages", "3"],
  ["PT041", "International Carriers", "3"],
  ["PT060", "Franchises on gas & water utilities", "2"],
  ["PT070", "Franchises on radio/TV broadcasting (≤P10M)", "3"],
  ["PT090", "Overseas dispatch/message from PH", "10"],
  ["PT120", "Life Insurance Premiums", "2"],
  ["PT130", "Agents of Foreign Insurance Cos.", "4"],
];

export function Guided2551Q({ tp, data, set, comp, onViewForm, onPrint }: GuidedProps<Comp2551Q>) {
  const F = makeGuided(data, set);
  const name = gName(tp);
  const rows = (data.rows as Row2551Q[] | undefined) || [{}, {}, {}, {}, {}, {}];

  function setRow(i: number, key: string, val: string) {
    const r = ((data.rows as Row2551Q[] | undefined) || [{}, {}, {}, {}, {}, {}]).map((x) => ({ ...x }));
    while (r.length <= i) r.push({});
    r[i][key] = val;
    set("rows", r);
  }

  const steps: GuidedStep[] = [
    {
      part: "Part I",
      tab: "Details",
      title: "Filing details",
      desc: "Which quarter is this percentage-tax return for?",
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
          <F.Q item="Item 4" label="Is this an Amended Return?">
            <F.YesNo field="amended" />
          </F.Q>
        </>
      ),
    },
    {
      part: "Schedule 1",
      tab: "Tax base",
      title: "Taxable amount & rate",
      desc: "Pick the percentage-tax type (ATC) and enter your taxable sales/receipts. The rate auto-fills and tax is computed.",
      render: () => (
        <>
          {rows.slice(0, 3).map((r, i) => (
            <div className="g-q" key={i}>
              <label className="g-q-label">
                <span className="g-q-item">Line {i + 1} · </span>Percentage tax type & taxable amount
              </label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <select
                  className="g-text"
                  style={{ maxWidth: 320 }}
                  value={r.atc || ""}
                  onChange={(e) => {
                    const f = ATC.find((a) => a[0] === e.target.value);
                    setRow(i, "atc", e.target.value);
                    if (f) setRow(i, "rate", f[2]);
                  }}
                >
                  <option value="">— select type —</option>
                  {ATC.map((a) => (
                    <option key={a[0]} value={a[0]}>
                      {a[0]} · {a[1]} ({a[2]}%)
                    </option>
                  ))}
                </select>
                <div className="g-money" style={{ maxWidth: 200 }}>
                  <span className="peso">₱</span>
                  <input
                    inputMode="decimal"
                    value={r.taxable == null ? "" : r.taxable}
                    placeholder="0"
                    onChange={(e) => setRow(i, "taxable", e.target.value.replace(/[^0-9.]/g, ""))}
                  />
                </div>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>{r.rate ? r.rate + "%" : ""}</span>
              </div>
            </div>
          ))}
          <F.Result rows={[{ label: "Total tax due", value: comp.i14, big: true }]} />
        </>
      ),
    },
    {
      part: "Part II",
      tab: "Payable",
      title: "Credits, penalties & total",
      desc: "Apply any creditable percentage tax withheld and penalties.",
      render: () => (
        <>
          <F.Q item="Item 15" label="Creditable Percentage Tax Withheld (BIR Form 2307)">
            <F.Money field="i15" />
          </F.Q>
          <F.Q item="Item 16" label="Tax Paid in Previously Filed Return (if amended)">
            <F.Money field="i16" />
          </F.Q>
          <F.Q label="Surcharge">
            <F.Money field="i20" />
          </F.Q>
          <F.Q label="Interest">
            <F.Money field="i21" />
          </F.Q>
          <F.Result
            rows={[
              { label: "Total tax due", value: comp.i14 },
              { label: "Less credits", value: comp.i18 },
              { label: comp.i24 < 0 ? "Overpayment" : "Total amount payable", value: comp.i24, big: true },
            ]}
          />
        </>
      ),
    },
    {
      part: "Review",
      tab: "Review",
      title: "Review & generate",
      desc: "Summary of your 2551Q. Open the official form to print or save as PDF.",
      render: () => (
        <F.Result
          rows={[
            { label: "Taxpayer", value: name, peso: false },
            {
              label: "Year · Quarter",
              value: ((data.year as string) || "—") + " · " + ((data.quarter as string) || "—"),
              peso: false,
            },
            { label: "Total tax due", value: comp.i14 },
            { label: comp.i24 < 0 ? "Overpayment" : "Total payable", value: comp.i24, big: true },
          ]}
        />
      ),
    },
  ];

  return <GuidedShell steps={steps} onViewForm={onViewForm} onPrint={onPrint} />;
}

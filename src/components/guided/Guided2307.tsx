// Guided2307.tsx — guided wizard for 2307 (Certificate of Creditable Tax Withheld).
// Ported from Guided2307 in bir-guided-certs.jsx.

import type { Comp2307 } from "../../lib/compute";
import { fmtAmt } from "../../lib/format";
import type { Row2307 } from "../../types";
import type { GuidedProps } from "../formProps";
import { GuidedShell, gName, makeGuided, type GuidedStep } from "./guidedKit";

export function Guided2307({ tp, data, set, comp, onViewForm, onPrint }: GuidedProps<Comp2307>) {
  const F = makeGuided(data, set);
  const name = gName(tp);
  const rows = (data.rows as Row2307[] | undefined) || [{}, {}, {}, {}];

  function setRow(i: number, key: string, val: string) {
    const r = ((data.rows as Row2307[] | undefined) || [{}, {}, {}, {}]).map((x) => ({ ...x }));
    while (r.length <= i) r.push({});
    r[i][key] = val;
    set("rows", r);
  }

  const steps: GuidedStep[] = [
    {
      part: "Period",
      tab: "Period",
      title: "Certificate period",
      desc: "This certificate covers a quarter of income payments. The payee (you/your taxpayer) is auto-filled.",
      render: () => (
        <>
          <F.ReadOnly
            items={[
              { label: "Payee", value: name },
              { label: "TIN", value: tp && tp.tin },
              { label: "Address", value: tp ? [tp.address, tp.city].filter(Boolean).join(", ") : "" },
              { label: "ZIP", value: tp && tp.zip },
            ]}
          />
          <F.Q item="Item 1" label="Period — From (MM/DD/YYYY)" req>
            <F.Txt field="periodFrom" ph="01/01/2024" maxw={180} />
          </F.Q>
          <F.Q label="Period — To (MM/DD/YYYY)" req>
            <F.Txt field="periodTo" ph="03/31/2024" maxw={180} />
          </F.Q>
        </>
      ),
    },
    {
      part: "Part II",
      tab: "Payor",
      title: "Payor information",
      desc: "Who made the income payments and withheld the tax (your client/customer).",
      render: () => (
        <>
          <F.Q item="Item 7" label="Payor’s Name" req>
            <F.Txt field="payorName" up />
          </F.Q>
          <F.Q item="Item 6" label="Payor’s TIN">
            <F.Txt field="payorTin" ph="000-000-000-000" maxw={220} />
          </F.Q>
          <F.Q item="Item 8" label="Payor’s Registered Address">
            <F.Txt field="payorAddr" up />
          </F.Q>
        </>
      ),
    },
    {
      part: "Part III",
      tab: "Income",
      title: "Income payments & taxes withheld",
      desc: "Enter each income payment by month of the quarter. The quarter total and tax withheld are summed automatically.",
      render: () => (
        <>
          {rows.map((r, i) => (
            <div className="g-q" key={i}>
              <label className="g-q-label">
                <span className="g-q-item">Line {i + 1}</span>
              </label>
              <input
                className="g-text"
                style={{ marginBottom: 8 }}
                placeholder="Nature of income payment"
                value={r.desc || ""}
                onChange={(e) => setRow(i, "desc", e.target.value)}
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, maxWidth: 460 }}>
                {(
                  [
                    ["m1", "1st month ₱"],
                    ["m2", "2nd month ₱"],
                    ["m3", "3rd month ₱"],
                    ["tax", "Tax withheld ₱"],
                  ] as Array<[string, string]>
                ).map(([k, lbl]) => (
                  <div key={k}>
                    <div className="g-pair-h">{lbl}</div>
                    <div className="g-money">
                      <span className="peso">₱</span>
                      <input
                        inputMode="decimal"
                        value={r[k] == null ? "" : r[k]}
                        placeholder="0"
                        onChange={(e) => setRow(i, k, e.target.value.replace(/[^0-9.]/g, ""))}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                Line total: ₱ {fmtAmt(comp.rows[i] ? comp.rows[i].total : 0)}
              </div>
            </div>
          ))}
          <F.Result
            rows={[
              { label: "Total income payments", value: comp.totalIncome },
              { label: "Total tax withheld", value: comp.totalTax, big: true },
            ]}
          />
        </>
      ),
    },
    {
      part: "Review",
      tab: "Review",
      title: "Review & generate",
      desc: "Summary of this 2307 certificate. Open the official form to print or save as PDF.",
      render: () => (
        <F.Result
          rows={[
            { label: "Payee", value: name, peso: false },
            { label: "Payor", value: (data.payorName as string) || "—", peso: false },
            {
              label: "Period",
              value: ((data.periodFrom as string) || "—") + " to " + ((data.periodTo as string) || "—"),
              peso: false,
            },
            { label: "Total income payments", value: comp.totalIncome },
            { label: "Total tax withheld", value: comp.totalTax, big: true },
          ]}
        />
      ),
    },
  ];

  return <GuidedShell steps={steps} onViewForm={onViewForm} onPrint={onPrint} />;
}

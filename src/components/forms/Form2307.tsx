// Form2307.tsx — faithful 2307 replica (Certificate of Creditable Tax Withheld at Source).
// Ported from form-2307.jsx.

import type { Comp2307 } from "../../lib/compute";
import { tin14 } from "../../lib/taxpayer";
import type { Row2307 } from "../../types";
import type { FormProps } from "../formProps";
import { BirHeader, PartBand } from "../formparts";
import { BirAmt, BirBoxes, BirText, BirVal } from "../formkit";

const ATC = [
  "WI010 Professional ≤P3M (5%)",
  "WI011 Professional >P3M (10%)",
  "WC010 Professional corp ≤P720k",
  "WI100 Contractors",
  "WI515 Rentals (5%)",
  "WC160 Income to contractors",
  "WI158 Goods – top withholding agent (1%)",
  "WI159 Services – top withholding agent (2%)",
];

export function Form2307({ tp, data, set, comp }: FormProps<Comp2307>) {
  const name = tp
    ? tp.kind === "individual"
      ? [tp.lastName, tp.firstName, tp.middleName].filter(Boolean).join(", ")
      : tp.regName
    : "";
  const rows = (data.rows as Row2307[] | undefined) || [{}, {}, {}, {}];

  function setRow(i: number, key: string, val: string) {
    const r = ((data.rows as Row2307[] | undefined) || [{}, {}, {}, {}]).map((x) => ({ ...x }));
    while (r.length <= i) r.push({});
    r[i][key] = val;
    set("rows", r);
  }

  return (
    <div className="bir-sheet">
      <BirHeader
        code="2307"
        date="January 2018 (ENCS)"
        page="1"
        title="Certificate of Creditable Tax Withheld at Source"
        pcode="2307 01/18 ENCS"
      />
      <div className="bir-instr bb b" style={{ borderTop: 0 }}>
        Fill in all applicable spaces. Mark all appropriate boxes with an &ldquo;X&rdquo;.
      </div>

      {/* For the period */}
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline grow">
          <span className="lblgrp">
            <span className="bir-ino">1</span> <span className="bir-cap">For the Period</span>
          </span>
          <div className="fld" style={{ gap: 8 }}>
            <span style={{ fontSize: 9.5 }}>From (MM/DD/YYYY)</span>
            <div style={{ width: 130 }}>
              <BirText field="periodFrom" data={data} set={set} lower />
            </div>
            <span style={{ fontSize: 9.5 }}>To</span>
            <div style={{ width: 130 }}>
              <BirText field="periodTo" data={data} set={set} lower />
            </div>
          </div>
        </div>
      </div>

      {/* Part I Payee */}
      <PartBand>Part I – Payee Information</PartBand>
      <div className="bir-cell b" style={{ borderTop: 0 }}>
        <span className="bir-ino">2</span> <span className="bir-cap">Taxpayer Identification Number (TIN)</span>
        <div style={{ marginTop: 3 }}>
          <BirBoxes value={tin14(tp && tp.tin, tp && tp.branch)} count={14} groups={[3, 3, 3, 5]} />
        </div>
      </div>
      <div className="bir-cell inline b" style={{ borderTop: 0 }}>
        <span className="lblgrp">
          <span className="bir-ino">3</span> <span className="bir-cap">Payee&rsquo;s Name</span>
        </span>
        <div className="fld">
          <BirVal value={name} />
        </div>
      </div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br grow">
          <span className="lblgrp">
            <span className="bir-ino">4</span> <span className="bir-cap">Registered Address</span>
          </span>
          <div className="fld">
            <BirVal value={tp ? [tp.address, tp.city].filter(Boolean).join(", ") : ""} fit />
          </div>
        </div>
        <div className="bir-cell inline" style={{ flex: "0 0 150px" }}>
          <span className="lblgrp">
            <span className="bir-ino">4A</span> <span className="bir-cap">ZIP</span>
          </span>
          <div className="fld">
            <BirVal value={tp && tp.zip} />
          </div>
        </div>
      </div>

      {/* Part II Payor */}
      <PartBand>Part II – Payor Information</PartBand>
      <div className="bir-cell b" style={{ borderTop: 0 }}>
        <span className="bir-ino">6</span> <span className="bir-cap">Taxpayer Identification Number (TIN)</span>
        <div style={{ marginTop: 3 }}>
          <BirBoxes value={tin14(data.payorTin as string)} count={14} groups={[3, 3, 3, 5]} />
        </div>
      </div>
      <div className="bir-cell inline b" style={{ borderTop: 0 }}>
        <span className="lblgrp">
          <span className="bir-ino">7</span> <span className="bir-cap">Payor&rsquo;s Name</span>
        </span>
        <div className="fld">
          <BirText field="payorName" data={data} set={set} />
        </div>
      </div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br grow">
          <span className="lblgrp">
            <span className="bir-ino">8</span> <span className="bir-cap">Registered Address</span>
          </span>
          <div className="fld">
            <BirText field="payorAddr" data={data} set={set} />
          </div>
        </div>
        <div className="bir-cell inline" style={{ flex: "0 0 150px" }}>
          <span className="lblgrp">
            <span className="bir-ino">8A</span> <span className="bir-cap">ZIP</span>
          </span>
          <div className="fld">
            <BirText field="payorZip" data={data} set={set} />
          </div>
        </div>
      </div>

      {/* Part III table */}
      <PartBand>Part III – Details of Monthly Income Payments and Taxes Withheld</PartBand>
      <div className="row b" style={{ borderTop: 0, background: "var(--shade2)", fontWeight: 700, fontSize: 9 }}>
        <div className="grow br" style={{ padding: "3px 5px" }}>
          Income Payments Subject to Expanded Withholding Tax
        </div>
        <div style={{ width: 80, padding: "3px 4px", textAlign: "center" }} className="br">
          ATC
        </div>
        <div style={{ width: 92, padding: "3px 4px", textAlign: "center" }} className="br">
          1st Month
        </div>
        <div style={{ width: 92, padding: "3px 4px", textAlign: "center" }} className="br">
          2nd Month
        </div>
        <div style={{ width: 92, padding: "3px 4px", textAlign: "center" }} className="br">
          3rd Month
        </div>
        <div style={{ width: 100, padding: "3px 4px", textAlign: "center" }} className="br">
          Total
        </div>
        <div style={{ width: 100, padding: "3px 4px", textAlign: "center" }}>Tax Withheld</div>
      </div>
      {rows.map((r, i) => (
        <div className="row b" style={{ borderTop: 0 }} key={i}>
          <div className="grow br">
            <BirText
              field="desc"
              data={r}
              set={(_k, v) => setRow(i, "desc", v)}
              placeholder="Nature of income payment"
              lower
            />
          </div>
          <div style={{ width: 80 }} className="br">
            <BirText field="atc" data={r} set={(_k, v) => setRow(i, "atc", v)} />
          </div>
          <div style={{ width: 92 }} className="br">
            <BirAmt field="m1" data={r} set={(_k, v) => setRow(i, "m1", v)} />
          </div>
          <div style={{ width: 92 }} className="br">
            <BirAmt field="m2" data={r} set={(_k, v) => setRow(i, "m2", v)} />
          </div>
          <div style={{ width: 92 }} className="br">
            <BirAmt field="m3" data={r} set={(_k, v) => setRow(i, "m3", v)} />
          </div>
          <div style={{ width: 100 }} className="br">
            <BirAmt ro value={comp.rows[i] ? comp.rows[i].total : 0} />
          </div>
          <div style={{ width: 100 }}>
            <BirAmt field="tax" data={r} set={(_k, v) => setRow(i, "tax", v)} />
          </div>
        </div>
      ))}
      <div className="row b" style={{ borderTop: 0, background: "var(--shade2)", fontWeight: 700 }}>
        <div className="grow br" style={{ padding: "4px 6px", fontSize: 11 }}>
          Total
        </div>
        <div style={{ width: 80 }} className="br"></div>
        <div style={{ width: 92 }} className="br">
          <BirAmt ro value={comp.tM1} />
        </div>
        <div style={{ width: 92 }} className="br">
          <BirAmt ro value={comp.tM2} />
        </div>
        <div style={{ width: 92 }} className="br">
          <BirAmt ro value={comp.tM3} />
        </div>
        <div style={{ width: 100 }} className="br">
          <BirAmt ro value={comp.totalIncome} />
        </div>
        <div style={{ width: 100 }}>
          <BirAmt ro value={comp.totalTax} />
        </div>
      </div>

      {/* common ATC reference */}
      <div style={{ marginTop: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 3 }}>Common ATCs (Expanded Withholding Tax)</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2px 16px",
            fontSize: 8.6,
            color: "#444",
          }}
        >
          {ATC.map((a) => (
            <div key={a}>{a}</div>
          ))}
        </div>
      </div>

      {/* declaration + conforme */}
      <div className="b" style={{ borderTop: 0, marginTop: 6 }}>
        <div className="bir-perjury bb">
          We declare under the penalties of perjury that this certificate has been made in good faith, verified by us,
          and to the best of our knowledge and belief, is true and correct, pursuant to the provisions of the National
          Internal Revenue Code, as amended.
        </div>
        <div className="row">
          <div className="bir-sign br grow" style={{ padding: "20px 6px 4px" }}>
            <BirText field="payorSig" data={data} set={set} />
            <div style={{ borderTop: "0.7px solid var(--ln)", marginTop: 3, paddingTop: 3 }}>
              Signature over Printed Name of Payor/Authorized Representative
            </div>
          </div>
          <div className="bir-sign grow" style={{ padding: "4px 6px 4px" }}>
            <div style={{ fontWeight: 700, fontSize: 9 }}>CONFORME:</div>
            <div style={{ paddingTop: 14 }}>
              <BirVal value={name} />
            </div>
            <div style={{ borderTop: "0.7px solid var(--ln)", marginTop: 3, paddingTop: 3 }}>
              Signature over Printed Name of Payee/Authorized Representative
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Form2551Q.tsx — faithful 2551Q replica (Quarterly Percentage Tax Return).
// Ported from form-2551Q.jsx (pages 1 & 2).

import type { Comp2551Q } from "../../lib/compute";
import type { Row2551Q } from "../../types";
import type { FormProps } from "../formProps";
import {
  BgInfoReturn,
  BirHeader,
  DeclSign,
  LineAmt,
  PartBand,
  PaymentDetails,
} from "../formparts";
import { BirAmt, BirBoxes, BirCkRow, BirText, BirVal } from "../formkit";

// Full official ATC list (Table 1) — [code, description, rate]
const ATC: Array<[string, string, string]> = [
  ["PT010", "Persons exempt from VAT under Sec. 109(BB) (Sec. 116)", "3"],
  ["PT040", "Domestic carriers and keepers of garages (Sec. 117)", "3"],
  ["PT041", "International Carriers (Sec. 118)", "3"],
  ["PT060", "Franchises on gas and water utilities (Sec. 119)", "2"],
  ["PT070", "Franchises on radio/TV broadcasting (≤P10M) (Sec. 119)", "3"],
  ["PT090", "Overseas dispatch, message or conversation from PH (Sec. 120)", "10"],
  ["PT140", "Cockpits (Sec. 125)", "18"],
  ["PT150", "Amusement places — cabarets, night/day clubs, videoke & karaoke bars, music lounges (Sec. 125)", "18"],
  ["PT160", "Boxing Exhibitions (Sec. 125)", "10"],
  ["PT170", "Professional Basketball Games (Sec. 125)", "15"],
  ["PT180", "Jai-alai and Race Tracks (Sec. 125)", "30"],
  ["PT105", "Banks/NBFI quasi-banking — lending, maturity ≤ 5 years (Sec. 121)", "5"],
  ["PT101", "Banks/NBFI quasi-banking — lending, maturity > 5 years (Sec. 121)", "1"],
  ["PT102", "Banks/NBFI — dividends, equity shares & net income of subsidiaries (Sec. 121)", "0"],
  ["PT103", "Banks/NBFI — royalties, rentals & other gross income (Sec. 121)", "7"],
  ["PT104", "Banks/NBFI — net trading gains on FX, securities, derivatives (Sec. 121)", "7"],
  ["PT113", "Other NBFI (non quasi-banking) — lending, maturity ≤ 5 years (Sec. 122)", "5"],
  ["PT114", "Other NBFI (non quasi-banking) — lending, maturity > 5 years (Sec. 122)", "1"],
  ["PT115", "Other NBFI — all other items treated as gross income (Sec. 122)", "5"],
  ["PT120", "Life Insurance Premiums (Sec. 123)", "2"],
  ["PT130", "Agents of Foreign Insurance Companies — Insurance Agents (Sec. 124)", "4"],
  ["PT132", "Owners of property insuring directly with foreign insurers (Sec. 124)", "5"],
];

export function Form2551Q({ tp, data, set, comp }: FormProps<Comp2551Q>) {
  const pick = (f: string, v: string) => set(f, data[f] === v ? "" : v);
  const is = (f: string, v: string) => data[f] === v;
  const name = tp ? (tp.kind === "individual" ? tp.lastName : tp.regName) : "";
  const rows = (data.rows as Row2551Q[] | undefined) || [{}, {}, {}, {}, {}, {}];

  function setRow(i: number, key: string, val: string) {
    const r = ((data.rows as Row2551Q[] | undefined) || [{}, {}, {}, {}, {}, {}]).map((x) => ({ ...x }));
    while (r.length <= i) r.push({});
    r[i][key] = val;
    set("rows", r);
  }

  return (
    <>
      {/* PAGE 1 */}
      <div className="bir-sheet">
        <BirHeader
          code="2551Q"
          date="January 2018 (ENCS)"
          page="1"
          title="Quarterly Percentage Tax Return"
          pcode="2551Q 01/18 P1"
        />
        <div className="bir-instr bb b" style={{ borderTop: 0 }}>
          Enter all required information in CAPITAL LETTERS using BLACK ink. Mark applicable boxes with an &ldquo;X&rdquo;.
          Two copies MUST be filed with the BIR and one held by the Taxpayer.
        </div>

        {/* line 1-5 */}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br" style={{ width: 200 }}>
            <span className="lblgrp">
              <span className="bir-ino">1</span> <span className="bir-cap">Period</span>
            </span>
            <div className="fld" style={{ gap: 10 }}>
              <BirCkRow on={is("periodType", "calendar")} onClick={() => pick("periodType", "calendar")}>
                Calendar
              </BirCkRow>
              <BirCkRow on={is("periodType", "fiscal")} onClick={() => pick("periodType", "fiscal")}>
                Fiscal
              </BirCkRow>
            </div>
          </div>
          <div className="bir-cell inline br" style={{ width: 215 }}>
            <span className="lblgrp">
              <span className="bir-ino">2</span> <span className="bir-cap">Year Ended (MM/YYYY)</span>
            </span>
            <div className="fld">
              <BirText field="year" data={data} set={set} placeholder="2024" />
            </div>
          </div>
          <div className="bir-cell inline br grow">
            <span className="lblgrp">
              <span className="bir-ino">3</span> <span className="bir-cap">Quarter</span>
            </span>
            <div className="fld" style={{ gap: 10 }}>
              {["1st", "2nd", "3rd", "4th"].map((q) => (
                <BirCkRow key={q} on={is("quarter", q)} onClick={() => pick("quarter", q)}>
                  {q}
                </BirCkRow>
              ))}
            </div>
          </div>
        </div>
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br grow">
            <span className="lblgrp">
              <span className="bir-ino">4</span> <span className="bir-cap">Amended Return?</span>
            </span>
            <div className="fld" style={{ gap: 12 }}>
              <BirCkRow on={is("amended", "yes")} onClick={() => pick("amended", "yes")}>
                Yes
              </BirCkRow>
              <BirCkRow on={is("amended", "no")} onClick={() => pick("amended", "no")}>
                No
              </BirCkRow>
            </div>
          </div>
          <div className="bir-cell inline" style={{ width: 290 }}>
            <span className="lblgrp">
              <span className="bir-ino">5</span> <span className="bir-cap">Number of Sheet/s Attached</span>
            </span>
            <div className="fld" style={{ width: 90 }}>
              <BirText field="sheets" data={data} set={set} />
            </div>
          </div>
        </div>

        <PartBand>Part I – Background Information</PartBand>
        <BgInfoReturn tp={tp} startNo={6} />

        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp">
            <span className="bir-ino">12</span>{" "}
            <span className="bir-cap">Availing of tax relief under Special Law or Treaty?</span>
          </span>
          <div className="fld" style={{ gap: 10 }}>
            <BirCkRow on={is("taxRelief", "yes")} onClick={() => pick("taxRelief", "yes")}>
              Yes
            </BirCkRow>
            <BirCkRow on={is("taxRelief", "no")} onClick={() => pick("taxRelief", "no")}>
              No
            </BirCkRow>
            <span style={{ fontSize: 9.5, marginLeft: 8 }}>
              <b>12A</b> If yes, specify
            </span>
            <div style={{ width: 180 }}>
              <BirText field="taxReliefSpec" data={data} set={set} />
            </div>
          </div>
        </div>

        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp">
            <span className="bir-ino">13</span>{" "}
            <span className="bir-cap">Income tax rate availed (individuals under Sec. 116)</span>
          </span>
          <div className="fld" style={{ gap: 16 }}>
            <BirCkRow on={is("itRate", "graduated")} onClick={() => pick("itRate", "graduated")}>
              Graduated income tax rate
            </BirCkRow>
            <BirCkRow on={is("itRate", "eight")} onClick={() => pick("itRate", "eight")}>
              8% income tax rate on gross sales/receipts
            </BirCkRow>
          </div>
        </div>

        {/* Part II */}
        <PartBand>Part II – Total Tax Payable</PartBand>
        <div className="b" style={{ borderTop: 0 }}>
          <LineAmt no="14" label="Total Tax Due" sub="(From Schedule 1 Item 7)" ro value={comp.i14} data={data} set={set} strong />
          <div className="bir-line bt">
            <div className="num"></div>
            <div className="desc" style={{ fontStyle: "italic", fontWeight: 700 }}>
              Less: Tax Credit/Payment (attach proof)
            </div>
            <div className="amtcell bl br" style={{ width: 220 }}></div>
          </div>
          <LineAmt no="15" label="Creditable Percentage Tax Withheld per BIR Form No. 2307" field="i15" data={data} set={set} />
          <LineAmt no="16" label="Tax Paid in Return Previously Filed, if this is an Amended Return" field="i16" data={data} set={set} />
          <LineAmt no="17" label="Other Tax Credit/Payment (specify)" field="i17" data={data} set={set} />
          <LineAmt no="18" label="Total Tax Credits/Payments (Sum of Items 15 to 17)" ro value={comp.i18} data={data} set={set} strong />
          <LineAmt no="19" label="Tax Still Payable/(Overpayment) (Item 14 Less Item 18)" ro value={comp.i19} data={data} set={set} strong />
          <div className="bir-line bt">
            <div className="num"></div>
            <div className="desc" style={{ fontStyle: "italic", fontWeight: 700 }}>
              Add: Penalties
            </div>
            <div className="amtcell bl br" style={{ width: 220 }}></div>
          </div>
          <LineAmt no="20" label="Surcharge" field="i20" data={data} set={set} />
          <LineAmt no="21" label="Interest" field="i21" data={data} set={set} />
          <LineAmt no="22" label="Compromise" field="i22" data={data} set={set} />
          <LineAmt no="23" label="Total Penalties (Sum of Items 20 to 22)" ro value={comp.i23} data={data} set={set} strong />
          <LineAmt
            no="24"
            label="TOTAL AMOUNT PAYABLE/(Overpayment) (Sum of Items 19 and 23)"
            ro
            value={comp.i24}
            data={data}
            set={set}
            strong
            bg
          />
        </div>

        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp">
            <span className="bir-capi">If overpayment, mark one box only:</span>
          </span>
          <div className="fld" style={{ gap: 20 }}>
            <BirCkRow on={is("over", "refund")} onClick={() => pick("over", "refund")}>
              To be refunded
            </BirCkRow>
            <BirCkRow on={is("over", "tcc")} onClick={() => pick("over", "tcc")}>
              To be issued a Tax Credit Certificate
            </BirCkRow>
          </div>
        </div>

        <DeclSign name={name} />
        <PaymentDetails data={data} set={set} startNo={25} />
      </div>

      {/* PAGE 2 — Schedule 1 */}
      <div className="bir-sheet">
        <BirHeader
          code="2551Q"
          date="January 2018 (ENCS)"
          page="2"
          title="Quarterly Percentage Tax Return"
          pcode="2551Q 01/18 P2"
        />
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br grow">
            <span className="lblgrp">
              <span className="bir-cap">TIN</span>
            </span>
            <div className="fld">
              <BirBoxes value={(tp && tp.tin) || ""} count={14} groups={[3, 3, 3, 5]} />
            </div>
          </div>
          <div className="bir-cell inline grow">
            <span className="lblgrp">
              <span className="bir-cap">Taxpayer&rsquo;s Name</span>
            </span>
            <div className="fld">
              <BirVal value={name} />
            </div>
          </div>
        </div>

        <div className="bir-section b" style={{ borderTop: 0 }}>
          Schedule 1 – Computation of Tax
        </div>
        <div className="row b" style={{ borderTop: 0, background: "var(--shade2)", fontWeight: 700, fontSize: 10 }}>
          <div style={{ width: 40, padding: "3px 4px", textAlign: "center" }} className="br">
            #
          </div>
          <div style={{ width: 240, padding: "3px 6px" }} className="br">
            Alphanumeric Tax Code (ATC)
          </div>
          <div className="grow br" style={{ padding: "3px 6px", textAlign: "right" }}>
            Taxable Amount
          </div>
          <div style={{ width: 90, padding: "3px 6px", textAlign: "center" }} className="br">
            Tax Rate
          </div>
          <div style={{ width: 170, padding: "3px 6px", textAlign: "right" }}>Tax Due</div>
        </div>
        {rows.map((r, i) => (
          <div className="row b" style={{ borderTop: 0 }} key={i}>
            <div style={{ width: 40, textAlign: "center", fontWeight: 700, fontSize: 11, paddingTop: 4 }} className="br">
              {i + 1}
            </div>
            <div style={{ width: 240 }} className="br">
              <select
                className="bir-select"
                value={r.atc || ""}
                onChange={(e) => {
                  const found = ATC.find((a) => a[0] === e.target.value);
                  setRow(i, "atc", e.target.value);
                  if (found) setRow(i, "rate", found[2]);
                }}
              >
                <option value="">— select —</option>
                {ATC.map((a) => (
                  <option key={a[0]} value={a[0]}>
                    {a[0]} · {a[1].length > 48 ? a[1].slice(0, 48) + "…" : a[1]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grow br">
              <BirAmt field="taxable" data={r} set={(_k, v) => setRow(i, "taxable", v)} />
            </div>
            <div
              style={{ width: 90, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}
              className="br"
            >
              <input
                className="bir-rate"
                inputMode="decimal"
                value={r.rate == null ? "" : r.rate}
                onChange={(e) => setRow(i, "rate", e.target.value.replace(/[^0-9.]/g, ""))}
              />
              <span style={{ fontSize: 11, color: "#555" }}>%</span>
            </div>
            <div style={{ width: 170 }}>
              <BirAmt ro value={comp.rows[i] ? comp.rows[i].due : 0} />
            </div>
          </div>
        ))}
        <div className="row b" style={{ borderTop: 0, background: "var(--shade2)" }}>
          <div className="grow" style={{ padding: "4px 6px", fontWeight: 700, fontSize: 11 }}>
            7 · Total Tax Due (Sum of Items 1 to 6) (To Part II Item 14)
          </div>
          <div style={{ width: 170 }} className="bl">
            <BirAmt ro value={comp.i14} />
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10.6, fontWeight: 700, marginBottom: 3 }}>
            Table 1 – Alphanumeric Tax Code (ATC)
          </div>
          <table className="bir-taxtable">
            <thead>
              <tr>
                <th style={{ width: 70 }}>ATC</th>
                <th>Percentage Tax On</th>
                <th style={{ width: 60 }}>Rate</th>
              </tr>
            </thead>
            <tbody>
              {ATC.map((a) => (
                <tr key={a[0]}>
                  <td style={{ fontWeight: 700 }}>{a[0]}</td>
                  <td>{a[1]}</td>
                  <td style={{ textAlign: "center" }}>{a[2]}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

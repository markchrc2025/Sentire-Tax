// Form2550Q.tsx — faithful 2550Q replica (Quarterly Value-Added Tax Return).
// Ported from form-2550Q.jsx (pages 1, 2 & 3 — full official line items).

import type { ReactNode } from "react";
import type { Comp2550Q } from "../../lib/compute";
import type { FilingData, FilingRow } from "../../types";
import { num } from "../../lib/format";
import type { FormProps } from "../formProps";
import {
  BirHeader,
  PartBand,
  BgInfoReturn,
  PaymentDetails,
  DeclSign,
} from "../formparts";
import { BirAmt, BirBoxes, BirCkRow, BirText, BirVal, type SetFn } from "../formkit";

export function Form2550Q({ tp, data, set, comp }: FormProps<Comp2550Q>) {
  const pick = (f: string, v: string) => set(f, data[f] === v ? "" : v);
  const is = (f: string, v: string) => data[f] === v;
  const name = tp ? (tp.kind === "individual" ? tp.lastName : tp.regName) : "";

  // single-amount line (label | amount). ro=computed.
  function L1({
    no,
    label,
    sub,
    field,
    ro,
    value,
    strong,
    bg,
  }: {
    no: ReactNode;
    label: ReactNode;
    sub?: string;
    field?: string;
    ro?: boolean;
    value?: number;
    strong?: boolean;
    bg?: boolean;
  }) {
    return (
      <div className="bir-line bt" style={bg ? { background: "var(--shade2)" } : undefined}>
        <div className="num">{no}</div>
        <div className="desc" style={{ fontWeight: strong ? 700 : 400 }}>
          {label}
          {sub && <small> {sub}</small>}
        </div>
        <div className="amtcell bl br" style={{ width: 200 }}>
          <BirAmt field={field} data={data} set={set} ro={ro} value={value} />
        </div>
      </div>
    );
  }

  // two-amount line: A (sales/purchases) | B (output/input tax)
  function L2({
    no,
    label,
    a,
    b,
    aRo,
    aVal,
    bRo,
    bVal,
    strong,
    bg,
    bBlank,
    aGrey,
  }: {
    no: ReactNode;
    label: ReactNode;
    a?: string;
    b?: string;
    aRo?: boolean;
    aVal?: number;
    bRo?: boolean;
    bVal?: number;
    strong?: boolean;
    bg?: boolean;
    bBlank?: boolean;
    aGrey?: boolean;
  }) {
    return (
      <div className="bir-line bt" style={bg ? { background: "var(--shade2)" } : undefined}>
        <div className="num">{no}</div>
        <div className="desc" style={{ fontWeight: strong ? 700 : 400 }}>
          {label}
        </div>
        <div className="amtcell bl br">
          {aGrey ? (
            <div style={{ background: "#f3f4f6", height: "100%" }} />
          ) : (
            <BirAmt field={a} data={data} set={set} ro={aRo} value={aVal} />
          )}
        </div>
        <div className="amtcell br">
          {bBlank ? (
            <div style={{ background: "#f3f4f6", height: "100%" }} />
          ) : (
            <BirAmt field={b} data={data} set={set} ro={bRo} value={bVal} />
          )}
        </div>
      </div>
    );
  }

  // input-tax-only line (B column), A column blank/grey
  function L1B({
    no,
    label,
    sub,
    field,
    ro,
    value,
    strong,
    bg,
  }: {
    no: ReactNode;
    label: ReactNode;
    sub?: string;
    field?: string;
    ro?: boolean;
    value?: number;
    strong?: boolean;
    bg?: boolean;
  }) {
    return (
      <div className="bir-line bt" style={bg ? { background: "var(--shade2)" } : undefined}>
        <div className="num">{no}</div>
        <div className="desc" style={{ fontWeight: strong ? 700 : 400 }}>
          {label}
          {sub && <small> {sub}</small>}
        </div>
        <div className="amtcell bl br" style={{ background: "#f3f4f6" }}></div>
        <div className="amtcell br">
          <BirAmt field={field} data={data} set={set} ro={ro} value={value} />
        </div>
      </div>
    );
  }

  const classification = (data.classification as string) || (tp && tp.classification) || "";

  return (
    <>
      {/* ============ PAGE 1 ============ */}
      <div className="bir-sheet">
        <BirHeader
          code="2550Q"
          date="April 2024 (ENCS)"
          page="1"
          title="Quarterly Value-Added Tax (VAT) Return"
          pcode="2550Q 04/24 ENCS P1"
        />
        <div className="bir-instr bb b" style={{ borderTop: 0 }}>
          Enter all required information in CAPITAL LETTERS using BLACK ink. Mark applicable boxes with an &ldquo;X&rdquo;.
          Two copies MUST be filed with the BIR and one held by the Taxpayer.
        </div>

        {/* 1 cal/fiscal | 2 year | 3 quarter */}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br" style={{ width: 250 }}>
            <span className="lblgrp">
              <span className="bir-ino">1</span> <span className="bir-cap">Period</span>
            </span>
            <div className="fld" style={{ gap: 12 }}>
              <BirCkRow on={is("periodType", "calendar")} onClick={() => pick("periodType", "calendar")}>
                Calendar
              </BirCkRow>
              <BirCkRow on={is("periodType", "fiscal")} onClick={() => pick("periodType", "fiscal")}>
                Fiscal
              </BirCkRow>
            </div>
          </div>
          <div className="bir-cell inline br" style={{ width: 240 }}>
            <span className="lblgrp">
              <span className="bir-ino">2</span> <span className="bir-cap">Year Ended (MM/YYYY)</span>
            </span>
            <div className="fld">
              <BirText field="year" data={data} set={set} placeholder="2024" />
            </div>
          </div>
          <div className="bir-cell inline grow">
            <span className="lblgrp">
              <span className="bir-ino">3</span> <span className="bir-cap">Quarter</span>
            </span>
            <div className="fld" style={{ gap: 12 }}>
              {["1st", "2nd", "3rd", "4th"].map((q) => (
                <BirCkRow key={q} on={is("quarter", q)} onClick={() => pick("quarter", q)}>
                  {q}
                </BirCkRow>
              ))}
            </div>
          </div>
        </div>

        {/* 4 return period | 5 amended | 6 short period */}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br grow">
            <span className="lblgrp">
              <span className="bir-ino">4</span> <span className="bir-cap">Return Period</span>
            </span>
            <div className="fld" style={{ gap: 8 }}>
              <span style={{ fontSize: 9.5 }}>From</span>
              <div style={{ width: 120 }}>
                <BirText field="periodFrom" data={data} set={set} lower />
              </div>
              <span style={{ fontSize: 9.5 }}>To</span>
              <div style={{ width: 120 }}>
                <BirText field="periodTo" data={data} set={set} lower />
              </div>
            </div>
          </div>
          <div className="bir-cell inline br" style={{ width: 190 }}>
            <span className="lblgrp">
              <span className="bir-ino">5</span> <span className="bir-cap">Amended?</span>
            </span>
            <div className="fld" style={{ gap: 10 }}>
              <BirCkRow on={is("amended", "yes")} onClick={() => pick("amended", "yes")}>
                Yes
              </BirCkRow>
              <BirCkRow on={is("amended", "no")} onClick={() => pick("amended", "no")}>
                No
              </BirCkRow>
            </div>
          </div>
          <div className="bir-cell inline" style={{ width: 200 }}>
            <span className="lblgrp">
              <span className="bir-ino">6</span> <span className="bir-cap">Short Period?</span>
            </span>
            <div className="fld" style={{ gap: 10 }}>
              <BirCkRow on={is("shortPeriod", "yes")} onClick={() => pick("shortPeriod", "yes")}>
                Yes
              </BirCkRow>
              <BirCkRow on={is("shortPeriod", "no")} onClick={() => pick("shortPeriod", "no")}>
                No
              </BirCkRow>
            </div>
          </div>
        </div>

        <PartBand>Part I – Background Information</PartBand>
        <BgInfoReturn tp={tp} startNo={7} />

        {/* 13 classification */}
        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp">
            <span className="bir-ino">13</span> <span className="bir-cap">Taxpayer Classification</span>
          </span>
          <div className="fld" style={{ gap: 16 }}>
            {["Micro", "Small", "Medium", "Large"].map((c) => (
              <BirCkRow key={c} on={classification === c} onClick={() => set("classification", c)}>
                {c}
              </BirCkRow>
            ))}
          </div>
        </div>
        {/* 14 tax relief */}
        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp">
            <span className="bir-ino">14</span>{" "}
            <span className="bir-cap">
              Availing of tax relief under Special Law or International Tax Treaty?
            </span>
          </span>
          <div className="fld" style={{ gap: 10 }}>
            <BirCkRow on={is("taxRelief", "yes")} onClick={() => pick("taxRelief", "yes")}>
              Yes
            </BirCkRow>
            <BirCkRow on={is("taxRelief", "no")} onClick={() => pick("taxRelief", "no")}>
              No
            </BirCkRow>
            <span style={{ fontSize: 9.5, marginLeft: 8 }}>
              <b>14A</b> If yes, specify
            </span>
            <div style={{ width: 180 }}>
              <BirText field="taxReliefSpec" data={data} set={set} />
            </div>
          </div>
        </div>

        <PartBand>Part II – Total Tax Payable</PartBand>
        <div className="b" style={{ borderTop: 0 }}>
          <L1 no="15" label="Net VAT Payable/(Excess Input Tax)" sub="(From Part IV, Item 61)" ro value={comp.i15} strong />
          <div className="bir-line bt">
            <div className="num"></div>
            <div className="desc" style={{ fontStyle: "italic", fontWeight: 700 }}>
              Less: Tax Credits/Payments
            </div>
            <div className="amtcell bl br" style={{ width: 200 }}></div>
          </div>
          <L1 no="16" label="Creditable VAT Withheld" sub="(From Part V - Schedule 3, Column D)" field="i16" />
          <L1 no="17" label="Advance VAT Payments" sub="(From Part V - Schedule 4)" field="i17" />
          <L1 no="18" label="VAT paid in return previously filed, if amended" field="i18" />
          <L1 no="19" label="Other Credits/Payment (specify)" field="i19" />
          <L1 no="20" label="Total Tax Credits/Payment (Sum of Items 16 to 19)" ro value={comp.i20} strong />
          <L1 no="21" label="Tax Still Payable/(Excess Credits) (Item 15 Less Item 20)" ro value={comp.i21} strong />
          <div className="bir-line bt">
            <div className="num"></div>
            <div className="desc" style={{ fontStyle: "italic", fontWeight: 700 }}>
              Add: Penalties
            </div>
            <div className="amtcell bl br" style={{ width: 200 }}></div>
          </div>
          <L1 no="22" label="Surcharge" field="i22" />
          <L1 no="23" label="Interest" field="i23" />
          <L1 no="24" label="Compromise" field="i24" />
          <L1 no="25" label="Total Penalties (Sum of Items 22 to 24)" ro value={comp.i25} strong />
          <L1 no="26" label="TOTAL AMOUNT PAYABLE/(Excess Credits) (Sum of Items 21 and 25)" ro value={comp.i26} strong bg />
        </div>

        <DeclSign name={name} />
        <PaymentDetails data={data} set={set} startNo={27} />
      </div>

      {/* ============ PAGE 2 — Part IV ============ */}
      <div className="bir-sheet">
        <BirHeader
          code="2550Q"
          date="April 2024 (ENCS)"
          page="2"
          title="Quarterly Value-Added Tax (VAT) Return"
          pcode="2550Q 04/24 ENCS P2"
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
          Part IV – Details of VAT Computation
        </div>

        {/* output */}
        <div className="row b" style={{ borderTop: 0, background: "var(--shade)", fontWeight: 700, fontSize: 9.4 }}>
          <div className="num" style={{ width: 28 }}></div>
          <div className="desc" style={{ flex: 1, padding: "3px 6px" }}>
            Total Sales and Output Tax
          </div>
          <div className="amtcell bl br bir-amthead">A. Sales (Exclusive of VAT)</div>
          <div className="amtcell br bir-amthead">B. Output Tax</div>
        </div>
        <div className="b" style={{ borderTop: 0 }}>
          <L2 no="31" label="VATable Sales (Output Tax = 12%)" a="i31a" bRo bVal={comp.i31b} />
          <L2 no="32" label="Zero-Rated Sales" a="i32a" bBlank />
          <L2 no="33" label="Exempt Sales" a="i33a" bBlank />
          <L2 no="34" label="Total Sales & Output Tax Due (Sum 31A–33A / Item 31B)" aRo aVal={comp.i34a} bRo bVal={comp.i34b} strong />
          <L2 no="35" label="Less: Output VAT on Uncollected Receivables" b="i35b" aGrey />
          <L2 no="36" label="Add: Output VAT on Recovered Uncollected Receivables Previously Deducted" b="i36b" aGrey />
          <L2 no="37" label="Total Adjusted Output Tax Due (34B Less 35B Add 36B)" bRo bVal={comp.i37} aGrey strong />
        </div>

        {/* input — carried over */}
        <div className="row b" style={{ borderTop: 0, background: "var(--shade)", fontWeight: 700, fontSize: 9.4 }}>
          <div className="num" style={{ width: 28 }}></div>
          <div className="desc" style={{ flex: 1, padding: "3px 6px" }}>
            Less: Allowable Input Tax
          </div>
          <div className="amtcell bl br"></div>
          <div className="amtcell br bir-amthead">B. Input Tax</div>
        </div>
        <div className="b" style={{ borderTop: 0 }}>
          <L1B no="38" label="Input Tax Carried Over from Previous Quarter" field="i38" />
          <L1B no="39" label="Input Tax Deferred on Capital Goods (>P1M) from Previous Quarter" field="i39" />
          <L1B no="40" label="Transitional Input Tax" field="i40" />
          <L1B no="41" label="Presumptive Input Tax" field="i41" />
          <L1B no="42" label="Others (specify)" field="i42" />
          <L1B no="43" label="Total (Sum of Items 38B to 42B)" ro value={comp.i43} strong />
        </div>

        {/* current transactions */}
        <div className="row b" style={{ borderTop: 0, background: "var(--shade)", fontWeight: 700, fontSize: 9.4 }}>
          <div className="num" style={{ width: 28 }}></div>
          <div className="desc" style={{ flex: 1, padding: "3px 6px" }}>
            Current Transactions
          </div>
          <div className="amtcell bl br bir-amthead">A. Purchases</div>
          <div className="amtcell br bir-amthead">B. Input Tax</div>
        </div>
        <div className="b" style={{ borderTop: 0 }}>
          <L2 no="44" label="Domestic Purchases" a="i44a" b="i44b" />
          <L2 no="45" label="Services Rendered by Non-Residents" a="i45a" b="i45b" />
          <L2 no="46" label="Importations" a="i46a" b="i46b" />
          <L2 no="47" label="Others (specify)" a="i47a" b="i47b" />
          <L2 no="48" label="Domestic Purchases with No Input Tax" a="i48a" bBlank />
          <L2 no="49" label="VAT-Exempt Importations" a="i49a" bBlank />
          <L2 no="50" label="Total Current Purchases / Input Tax (44A–49A / 44B–47B)" aRo aVal={comp.i50a} bRo bVal={comp.i50b} strong />
          <L1B no="51" label="Total Available Input Tax (Sum of Items 43B and 50B)" ro value={comp.i51} strong />
        </div>

        {/* deductions */}
        <div className="row b" style={{ borderTop: 0, background: "var(--shade)", fontWeight: 700, fontSize: 9.4 }}>
          <div className="num" style={{ width: 28 }}></div>
          <div className="desc" style={{ flex: 1, padding: "3px 6px" }}>
            Less: Adjustments/Deductions from Input Tax
          </div>
          <div className="amtcell bl br"></div>
          <div className="amtcell br bir-amthead">B. Input Tax</div>
        </div>
        <div className="b" style={{ borderTop: 0 }}>
          <L1B no="52" label="Input Tax on Capital Goods (>P1M) deferred for succeeding period" field="i52" />
          <L1B no="53" label="Input Tax Attributable to VAT Exempt Sales (Schedule 2)" field="i53" />
          <L1B no="54" label="VAT Refund/TCC Claimed" field="i54" />
          <L1B no="55" label="Input VAT on Unpaid Payables" field="i55" />
          <L1B no="56" label="Others (specify)" field="i56" />
          <L1B no="57" label="Total Deductions from Input Tax (Sum of Items 52B to 56B)" ro value={comp.i57} strong />
          <L1B no="58" label="Add: Input VAT on Settled Unpaid Payables Previously Deducted" field="i58" />
          <L1B no="59" label="Adjusted Deductions from Input Tax (Sum of Items 57B and 58B)" ro value={comp.i59} strong />
          <L1B no="60" label="Total Allowable Input Tax (Item 51B Less Item 59B)" ro value={comp.i60} strong bg />
          <L1B no="61" label="Net VAT Payable/(Excess Input Tax) (Item 37B Less 60B) (To Part II, Item 15)" ro value={comp.i61} strong bg />
        </div>
      </div>

      {/* ============ PAGE 3 — Part V Schedules ============ */}
      <div className="bir-sheet">
        <BirHeader
          code="2550Q"
          date="April 2024 (ENCS)"
          page="3"
          title="Quarterly Value-Added Tax (VAT) Return"
          pcode="2550Q 04/24 ENCS P3"
        />
        <div className="bir-section b" style={{ borderTop: 0 }}>
          Part V – Schedules
        </div>

        <SchedTable
          title="Schedule 1 – Amortized Input Tax from Capital Goods"
          cols={[
            "Date Purchased/Imported",
            "Source Code (D/I)",
            "Description",
            "Amount of Purchase (>P1M)",
            "Balance of Input Tax (Prev.)",
            "Est. Life (mos)",
            "Recognized Life (mos)",
            "Allowable Input Tax",
            "Balance to Next Period",
          ]}
          fieldKey="sch1"
          rows={3}
          data={data}
          set={set}
        />

        <div className="bir-section b" style={{ borderTop: 0, marginTop: 8 }}>
          Schedule 2 – Input Tax Attributable to VAT Exempt Sales
        </div>
        <div className="b" style={{ borderTop: 0 }}>
          <L1 no="" label="Input Tax directly attributable to VAT Exempt Sale" field="sch2_direct" />
          <L1 no="" label="Add: Ratable portion of Input Tax not directly attributable" field="sch2_ratable" />
          <L1
            no=""
            label="Total Input Tax attributable to Exempt Sale (To Part IV, Item 53)"
            ro
            value={num(data.sch2_direct) + num(data.sch2_ratable)}
            strong
          />
        </div>

        <SchedTable
          title="Schedule 3 – Creditable VAT Withheld"
          cols={[
            "Period Covered",
            "Name of Withholding Agent",
            "Income Payment",
            "Total Tax Withheld (To Part II, Item 16)",
          ]}
          fieldKey="sch3"
          rows={3}
          data={data}
          set={set}
        />

        <SchedTable
          title="Schedule 4 – Advance VAT Payment"
          cols={[
            "Period Covered",
            "Name of Miller",
            "Name of Taxpayer",
            "OR Number",
            "Amount Paid (To Part II, Item 17)",
          ]}
          fieldKey="sch4"
          rows={3}
          data={data}
          set={set}
        />

        <div style={{ marginTop: 8, fontSize: 10, color: "#555", padding: "0 4px" }}>
          VAT is <b>12%</b> of VATable sales. Net VAT payable = Total Adjusted Output Tax (Item 37) less Total Allowable
          Input Tax (Item 60).
        </div>
      </div>
    </>
  );
}

// generic schedule table with editable cells
function SchedTable({
  title,
  cols,
  fieldKey,
  rows,
  data,
  set,
}: {
  title: string;
  cols: string[];
  fieldKey: string;
  rows: number;
  data: FilingData;
  set: SetFn;
}) {
  const stored = data[fieldKey];
  const list: FilingRow[] = Array.isArray(stored)
    ? stored
    : Array.from({ length: rows }, () => ({}) as FilingRow);

  function setCell(i: number, c: number, v: string) {
    const base = Array.isArray(data[fieldKey])
      ? (data[fieldKey] as FilingRow[])
      : Array.from({ length: rows }, () => ({}) as FilingRow);
    const arr: FilingRow[] = base.map((x) => ({ ...x }));
    while (arr.length <= i) arr.push({});
    arr[i]["c" + c] = v;
    set(fieldKey, arr);
  }

  return (
    <>
      <div className="bir-section b" style={{ borderTop: 0 }}>
        {title}
      </div>
      <div className="row b" style={{ borderTop: 0, background: "var(--shade2)", fontWeight: 700, fontSize: 8.4 }}>
        {cols.map((c, i) => (
          <div
            key={i}
            className={i < cols.length - 1 ? "br" : ""}
            style={{ flex: 1, padding: "3px 4px", textAlign: "center" }}
          >
            {c}
          </div>
        ))}
      </div>
      {list.map((r, ri) => (
        <div className="row b" style={{ borderTop: 0 }} key={ri}>
          {cols.map((_c, ci) => (
            <div key={ci} className={ci < cols.length - 1 ? "br" : ""} style={{ flex: 1 }}>
              <BirText field={"c" + ci} data={r} set={(_k, v) => setCell(ri, ci, v)} lower />
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

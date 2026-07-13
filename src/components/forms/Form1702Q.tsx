// Form1702Q.tsx — faithful 3-page replica of BIR Form 1702Q (January 2018 ENCS),
// Quarterly Income Tax Return for Corporations, Partnerships and Other
// Non-Individual Taxpayers. Mirrors the official printed layout:
//   Page 1 — Part I Background, Part II Total Tax Payable, signatories, Part III.
//   Page 2 — Part IV Schedules 1 (special/exempt), 2 (regular), 3 (MCIT), 4 (credits).
//   Page 3 — Tax-rate / ATC reference table.
//
// Engine-computed summary lines are read-only; the editable inputs are the
// detailed schedule entries. Field keys match build1702Q + Guided1702Q.

import { createContext, useContext, type ReactNode } from "react";
import type { Comp1702Q } from "../../lib/compute";
import type { FormProps } from "../formProps";
import type { FilingData } from "../../types";
import { BirHeader, PartBand, PaymentDetails } from "../formparts";
import { BirAmt, BirBoxes, BirCkRow, BirText, BirVal, type SetFn } from "../formkit";

// ── form-wide context so the row helpers below can live at MODULE scope.
//    Defining them inside the component gave each render a new component type,
//    which remounted every <input> on each keystroke and dropped the cursor. ──
interface Ctx1702Q {
  data: FilingData;
  set: SetFn;
}
const FormCtx = createContext<Ctx1702Q | null>(null);
const useF = () => useContext(FormCtx) as Ctx1702Q;

// ── single-amount row: number | label | one amount cell ──
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
  no?: ReactNode;
  label: ReactNode;
  sub?: string;
  field?: string;
  ro?: boolean;
  value?: number;
  strong?: boolean;
  bg?: boolean;
}) {
  const { data, set } = useF();
  return (
    <div className="bir-line bt" style={bg ? { background: "var(--shade2)" } : undefined}>
      <div className="num">{no}</div>
      <div className="desc" style={{ fontWeight: strong ? 700 : 400 }}>
        {label}
        {sub && <small> {sub}</small>}
      </div>
      <div className="amtcell bl br" style={{ width: 220 }}>
        <BirAmt field={field} data={data} set={set} ro={ro} value={value} />
      </div>
    </div>
  );
}

// ── two-column row (Schedule 1: A Exempt | B Special) ──
function L2({
  no,
  label,
  base,
  roA,
  roB,
  valA,
  valB,
  strong,
}: {
  no?: ReactNode;
  label: ReactNode;
  base: string;
  roA?: boolean;
  roB?: boolean;
  valA?: number;
  valB?: number;
  strong?: boolean;
}) {
  const { data, set } = useF();
  return (
    <div className="bir-line bt">
      <div className="num">{no}</div>
      <div className="desc" style={{ fontWeight: strong ? 700 : 400 }}>
        {label}
      </div>
      <div className="amtcell bl br" style={{ width: 188 }}>
        <BirAmt field={base + "A"} data={data} set={set} ro={roA} value={valA} />
      </div>
      <div className="amtcell br" style={{ width: 188 }}>
        <BirAmt field={base + "B"} data={data} set={set} ro={roB} value={valB} />
      </div>
    </div>
  );
}

// ── grey "A. EXEMPT | B. SPECIAL" column header for Schedule 1 ──
function ExemptSpecialHead() {
  return (
    <div
      className="row b"
      style={{ borderTop: 0, background: "var(--shade2)", fontWeight: 700, alignItems: "stretch", minHeight: 22 }}
    >
      <div className="num" style={{ width: 28, flex: "none" }}></div>
      <div className="desc" style={{ flex: 1, fontSize: 10.6, display: "flex", alignItems: "center", padding: "2px 6px" }}>
        Particulars
      </div>
      <div
        className="amtcell bl br bir-amthead"
        style={{ width: 188, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        A. EXEMPT
      </div>
      <div
        className="amtcell br bir-amthead"
        style={{ width: 188, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        B. SPECIAL
      </div>
    </div>
  );
}

// ── two-column rate row (Schedule 1 Item 10) ──
function RateRow2({ no, label, valA, fieldB }: { no: ReactNode; label: string; valA: string; fieldB: string }) {
  const { data, set } = useF();
  return (
    <div className="bir-line bt">
      <div className="num">{no}</div>
      <div className="desc">{label}</div>
      <div
        className="amtcell bl br"
        style={{ width: 188, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2, paddingRight: 6 }}
      >
        <span className="bir-rate ro" style={{ opacity: 0.7 }}>
          {valA}
        </span>
        <span style={{ fontSize: 11, color: "#555" }}>%</span>
      </div>
      <div
        className="amtcell br"
        style={{ width: 188, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2, paddingRight: 6 }}
      >
        <input
          className="bir-rate"
          inputMode="decimal"
          value={data[fieldB] == null ? "" : (data[fieldB] as string)}
          placeholder="0"
          onChange={(e) => set(fieldB, e.target.value.replace(/[^0-9.]/g, ""))}
        />
        <span style={{ fontSize: 11, color: "#555" }}>%</span>
      </div>
    </div>
  );
}

export function Form1702Q({ tp, data, set, comp }: FormProps<Comp1702Q>) {
  const pick = (f: string, v: string) => set(f, data[f] === v ? "" : v);
  const is = (f: string, v: string) => data[f] === v;
  const regName = tp
    ? tp.kind === "individual"
      ? [tp.lastName, tp.firstName].filter(Boolean).join(", ")
      : tp.regName
    : "";

  return (
    <FormCtx.Provider value={{ data, set }}>
      {/* ============================ PAGE 1 ============================ */}
      <div className="bir-sheet">
        <BirHeader
          code="1702Q"
          date="January 2018 (ENCS)"
          page="1"
          title="Quarterly Income Tax Return"
          sub="For Corporations, Partnerships and Other Non-Individual Taxpayers"
          pcode="1702Q 01/18 ENCS P1"
        />
        <div className="bir-instr bb b" style={{ borderTop: 0 }}>
          Enter all required information in CAPITAL LETTERS. Mark applicable boxes with an &ldquo;X&rdquo;. Two copies
          MUST be filed with the BIR and one held by the taxpayer.
        </div>

        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br" style={{ width: 170 }}>
            <span className="lblgrp">
              <span className="bir-ino">1</span> <span className="bir-cap">For</span>
            </span>
            <div className="fld" style={{ gap: 8 }}>
              <BirCkRow on={is("periodType", "calendar")} onClick={() => pick("periodType", "calendar")}>
                Calendar
              </BirCkRow>
              <BirCkRow on={is("periodType", "fiscal")} onClick={() => pick("periodType", "fiscal")}>
                Fiscal
              </BirCkRow>
            </div>
          </div>
          <div className="bir-cell inline br" style={{ width: 180 }}>
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
              {["1st", "2nd", "3rd"].map((q) => (
                <BirCkRow key={q} on={is("quarter", q)} onClick={() => pick("quarter", q)}>
                  {q}
                </BirCkRow>
              ))}
            </div>
          </div>
          <div className="bir-cell inline" style={{ width: 170 }}>
            <span className="lblgrp">
              <span className="bir-ino">4</span> <span className="bir-cap">Amended?</span>
            </span>
            <div className="fld" style={{ gap: 8 }}>
              <BirCkRow on={is("amended", "yes")} onClick={() => pick("amended", "yes")}>
                Yes
              </BirCkRow>
              <BirCkRow on={is("amended", "no")} onClick={() => pick("amended", "no")}>
                No
              </BirCkRow>
            </div>
          </div>
        </div>

        {/* 5 Alphanumeric Tax Code (ATC) */}
        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp">
            <span className="bir-ino">5</span> <span className="bir-cap">Alphanumeric Tax Code (ATC)</span>
          </span>
          <div className="fld" style={{ gap: 8 }}>
            <BirText field="atc" data={data} set={set} placeholder="IC 055" />
            <span style={{ fontSize: 9.6, color: "#555" }}>
              e.g. IC 055 — Minimum Corporate Income Tax (MCIT); see the rate table on page 3.
            </span>
          </div>
        </div>

        <PartBand>Part I – Background Information</PartBand>
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell br" style={{ width: 360 }}>
            <span className="bir-ino">6</span> <span className="bir-cap">TIN</span>
            <div style={{ marginTop: 3 }}>
              <BirBoxes value={(tp && tp.tin) || ""} count={14} groups={[3, 3, 3, 5]} />
            </div>
          </div>
          <div className="bir-cell" style={{ width: 130 }}>
            <span className="bir-ino">7</span> <span className="bir-cap">RDO Code</span>
            <div style={{ marginTop: 3 }}>
              <BirBoxes value={(tp && tp.rdo) || ""} count={3} />
            </div>
          </div>
        </div>
        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp">
            <span className="bir-ino">8</span> <span className="bir-cap">Registered Name</span>
          </span>
          <div className="fld">
            <BirVal value={regName} />
          </div>
        </div>
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br grow">
            <span className="lblgrp">
              <span className="bir-ino">9</span> <span className="bir-cap">Registered Address</span>
            </span>
            <div className="fld">
              <BirVal value={tp ? [tp.address, tp.city].filter(Boolean).join(", ") : ""} fit />
            </div>
          </div>
          <div className="bir-cell inline" style={{ flex: "0 0 150px" }}>
            <span className="lblgrp">
              <span className="bir-ino">9A</span> <span className="bir-cap">ZIP</span>
            </span>
            <div className="fld">
              <BirVal value={tp?.zip} />
            </div>
          </div>
        </div>
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br" style={{ width: 360 }}>
            <span className="lblgrp">
              <span className="bir-ino">10</span> <span className="bir-cap">Contact Number</span>
            </span>
            <div className="fld">
              <BirVal value={tp?.phone} lower />
            </div>
          </div>
          <div className="bir-cell inline grow">
            <span className="lblgrp">
              <span className="bir-ino">11</span> <span className="bir-cap">Email</span>
            </span>
            <div className="fld">
              <BirVal value={tp?.email} lower />
            </div>
          </div>
        </div>
        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp">
            <span className="bir-ino">12</span> <span className="bir-cap">Method of Deductions</span>
          </span>
          <div className="fld" style={{ gap: 16 }}>
            <BirCkRow on={is("method", "itemized")} onClick={() => pick("method", "itemized")}>
              Itemized Deductions [Section 34 (A-J), NIRC]
            </BirCkRow>
            <BirCkRow on={is("method", "osd")} onClick={() => pick("method", "osd")}>
              Optional Standard Deduction (OSD) — 40% of Gross Income [Section 34(L), NIRC]
            </BirCkRow>
          </div>
        </div>
        {/* 13 Tax relief under Special Law / International Tax Treaty + 13A specify */}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br" style={{ width: 420 }}>
            <span className="lblgrp">
              <span className="bir-ino">13</span>{" "}
              <span className="bir-cap">
                Are you availing of tax relief under Special Law/International Tax Treaty?
              </span>
            </span>
            <div className="fld" style={{ gap: 10 }}>
              <BirCkRow on={is("treaty", "yes")} onClick={() => pick("treaty", "yes")}>
                Yes
              </BirCkRow>
              <BirCkRow on={is("treaty", "no")} onClick={() => pick("treaty", "no")}>
                No
              </BirCkRow>
            </div>
          </div>
          <div className="bir-cell inline grow">
            <span className="lblgrp">
              <span className="bir-ino">13A</span> <span className="bir-cap">If yes, specify</span>
            </span>
            <div className="fld">
              <BirText field="treatySpecify" data={data} set={set} />
            </div>
          </div>
        </div>

        <PartBand sub="(DO NOT enter Centavos; 49 Centavos or Less drop down; 50 or more round up)">
          Part II – Total Tax Payable
        </PartBand>
        <div className="b" style={{ borderTop: 0 }}>
          <L1 no="14" label="Income Tax Due – Regular/Normal Rate (From Part IV - Sch. 2, Item 13)" ro value={comp.i14} strong />
          <L1
            no="15"
            label="Less: Unexpired Excess of Prior Year’s MCIT over Regular/Normal Income Tax Rate"
            field="i15"
          />
          <L1 no="16" label="Balance / Income Tax Still Due – Regular/Normal Rate (Item 14 Less 15)" ro value={comp.i16} />
          <L1 no="17" label="Add: Income Tax Due – Special Rate (From Part IV - Sch. 1, Item 13)" ro value={comp.i17} />
          <L1 no="18" label="Aggregate Income Tax Due (Sum of Items 16 and 17)" ro value={comp.i18} strong />
          <L1 no="19" label="Less: Total Tax Credits/Payments (From Part IV - Sch. 4, Item 7)" ro value={comp.i19} />
          <L1 no="20" label="Net Tax Payable / (Overpayment) (Item 18 Less 19)" ro value={comp.i20} strong />
          <div className="bir-line bt">
            <div className="num"></div>
            <div className="desc" style={{ fontStyle: "italic", fontWeight: 700 }}>
              Add: Penalties
            </div>
            <div className="amtcell bl br" style={{ width: 220 }}></div>
          </div>
          <L1 no="21" label="Surcharge" field="i21" />
          <L1 no="22" label="Interest" field="i22" />
          <L1 no="23" label="Compromise" field="i23" />
          <L1 no="24" label="Total Penalties (Sum of Items 21 to 23)" ro value={comp.i24} strong />
          <L1
            no="25"
            label="TOTAL AMOUNT PAYABLE / (Overpayment) (Sum of Items 20 and 24)"
            ro
            value={comp.i25}
            strong
            bg
          />
        </div>

        <div className="b" style={{ borderTop: 0 }}>
          <div className="bir-perjury bb">
            We declare under the penalties of perjury that this return, and all its attachments, have been made in good
            faith, verified by us, and to the best of our knowledge and belief, are true and correct, pursuant to the
            provisions of the National Internal Revenue Code, as amended, and the regulations issued under authority
            thereof. (If signed by an Authorized Representative, indicate TIN and attach authorization letter)
          </div>
          {/* 26 Number of Attachments */}
          <div className="bir-cell inline bb" style={{ borderTop: 0 }}>
            <span className="lblgrp">
              <span className="bir-ino">26</span> <span className="bir-cap">Number of Attachments</span>
            </span>
            <div className="fld" style={{ maxWidth: 120 }}>
              <BirText field="attachments" data={data} set={set} placeholder="0" />
            </div>
          </div>
          <div className="row">
            <div className="bir-sign br grow" style={{ padding: "18px 6px 4px" }}>
              <BirVal value={regName} />
              <div style={{ borderTop: "0.7px solid var(--ln)", marginTop: 3, paddingTop: 3 }}>
                Signature over Printed Name of President/Principal Officer/Authorized Representative
              </div>
              <div className="row" style={{ gap: 8, marginTop: 6 }}>
                <div className="bir-cell inline grow" style={{ borderTop: 0 }}>
                  <span className="bir-cap">Title of Signatory</span>
                  <div className="fld">
                    <BirText field="presTitle" data={data} set={set} />
                  </div>
                </div>
                <div className="bir-cell inline" style={{ width: 180, borderTop: 0 }}>
                  <span className="bir-cap">TIN</span>
                  <div className="fld">
                    <BirText field="presTin" data={data} set={set} lower />
                  </div>
                </div>
              </div>
            </div>
            <div className="bir-sign grow" style={{ padding: "18px 6px 4px" }}>
              <BirText field="treasurer" data={data} set={set} />
              <div style={{ borderTop: "0.7px solid var(--ln)", marginTop: 3, paddingTop: 3 }}>
                Signature over Printed Name of Treasurer/Assistant Treasurer
              </div>
              <div className="row" style={{ gap: 8, marginTop: 6 }}>
                <div className="bir-cell inline grow" style={{ borderTop: 0 }}>
                  <span className="bir-cap">Title of Signatory</span>
                  <div className="fld">
                    <BirText field="treasTitle" data={data} set={set} />
                  </div>
                </div>
                <div className="bir-cell inline" style={{ width: 180, borderTop: 0 }}>
                  <span className="bir-cap">TIN</span>
                  <div className="fld">
                    <BirText field="treasTin" data={data} set={set} lower />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <PaymentDetails data={data} set={set} startNo={27} />
      </div>

      {/* ============================ PAGE 2 — Part IV Schedules ============================ */}
      <div className="bir-sheet">
        <BirHeader
          code="1702Q"
          date="January 2018 (ENCS)"
          page="2"
          title="Quarterly Income Tax Return"
          sub="For Corporations, Partnerships and Other Non-Individual Taxpayers"
          pcode="1702Q 01/18 ENCS P2"
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
              <span className="bir-cap">Registered Name</span>
            </span>
            <div className="fld">
              <BirVal value={regName} />
            </div>
          </div>
        </div>

        <PartBand sub="(DO NOT enter Centavos; 49 Centavos or Less drop down; 50 or more round up)">
          Part IV – Schedules
        </PartBand>

        {/* Schedule 1 — EXEMPT / SPECIAL */}
        <div className="bir-section b" style={{ borderTop: 0 }}>
          Schedule 1 – Declaration this Quarter
        </div>
        <ExemptSpecialHead />
        <div className="b" style={{ borderTop: 0 }}>
          <L2 no="1" label="Sales/Receipts/Revenues/Fees" base="sch1_1" />
          <L2 no="2" label="Less: Cost of Sales/Services" base="sch1_2" />
          <L2 no="3" label="Gross Income from Operation (Item 1 Less 2)" base="sch1_3" roA roB valA={comp.sch1_3A} valB={comp.sch1_3B} strong />
          <L2 no="4" label="Add: Non-Operating and Other Taxable Income" base="sch1_4" />
          <L2 no="5" label="Total Gross Income (Sum of Items 3 and 4)" base="sch1_5" roA roB valA={comp.sch1_5A} valB={comp.sch1_5B} strong />
          <L2 no="6" label="Less: Deductions" base="sch1_6" />
          <L2 no="7" label="Taxable Income this Quarter (Item 5 Less 6)" base="sch1_7" roA roB valA={comp.sch1_7A} valB={comp.sch1_7B} strong />
          <L2 no="8" label="Add: Taxable Income Previous Quarter/s" base="sch1_8" />
          <L2 no="9" label="Total Taxable Income to Date (Sum of Items 7 & 8)" base="sch1_9" roA roB valA={comp.sch1_9A} valB={comp.sch1_9B} strong />
          <RateRow2
            no="10"
            label="Applicable Income Tax Rate [except MCIT rate]"
            valA="0"
            fieldB="sch1Rate"
          />
          <L2 no="11" label="Income Tax Due Other than MCIT (Item 9 × Item 10)" base="sch1_11" roA roB valA={comp.sch1_11A} valB={comp.sch1_11B} />
          <L2 no="12" label="Less: Share of Other Agencies, if remitted directly" base="sch1_12" />
          <L2
            no="13"
            label="Net Income Tax Due to National Government (Item 11 Less 12) (To Part II Item 17)"
            base="sch1_13"
            roA
            roB
            valA={comp.sch1_13A}
            valB={comp.sch1_13B}
            strong
          />
        </div>

        {/* Schedule 2 — REGULAR / NORMAL RATE */}
        <div className="bir-section b" style={{ borderTop: 0 }}>
          Schedule 2 – Declaration this Quarter — REGULAR / NORMAL RATE
        </div>
        <div className="b" style={{ borderTop: 0 }}>
          <L1 no="1" label="Sales/Receipts/Revenues/Fees" field="s2_1" />
          <L1 no="2" label="Less: Cost of Sales/Services" field="s2_2" />
          <L1 no="3" label="Gross Income from Operation (Item 1 Less 2)" ro value={comp.s2_3} strong />
          <L1 no="4" label="Add: Non-Operating and Other Taxable Income" field="s2_4" />
          <L1 no="5" label="Total Gross Income (Sum of Items 3 and 4)" ro value={comp.s2_5} strong />
          <L1
            no="6"
            label="Less: Deductions (Itemized entry or OSD auto-40% of gross income)"
            field="s2_6"
            ro={comp.method === "osd"}
            value={comp.method === "osd" ? comp.s2_6 : undefined}
          />
          <L1 no="7" label="Taxable Income this Quarter (Item 5 Less 6)" ro value={comp.s2_7} strong />
          <L1 no="8" label="Add: Taxable Income Previous Quarter/s" field="s2_8" />
          <L1 no="9" label="Total Taxable Income to Date (Sum of Items 7 and 8)" ro value={comp.s2_9} strong />
          <div className="bir-line bt">
            <div className="num">10</div>
            <div className="desc">Applicable Income Tax Rate (except MCIT)</div>
            <div
              className="amtcell bl br"
              style={{
                width: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 2,
                paddingRight: 6,
              }}
            >
              <input
                className="bir-rate"
                inputMode="decimal"
                value={data.rate == null ? "25" : (data.rate as string)}
                onChange={(e) => set("rate", e.target.value.replace(/[^0-9.]/g, ""))}
              />
              <span style={{ fontSize: 11, color: "#555" }}>%</span>
            </div>
          </div>
          <L1 no="11" label="Income Tax Due Other than MCIT (Item 9 × Item 10)" ro value={comp.s2_11} />
          <L1 no="12" label="Minimum Corporate Income Tax — MCIT (From Schedule 3 Item 6)" ro value={comp.mcit} />
          <L1
            no="13"
            label="Income Tax Due (Normal in Item 11 or MCIT in Item 12, whichever is higher) (To Part II Item 14)"
            ro
            value={comp.s2_13}
            strong
            bg
          />
        </div>

        {/* Schedule 3 — MCIT */}
        <div className="bir-section b" style={{ borderTop: 0 }}>
          Schedule 3 – Computation of Minimum Corporate Income Tax (MCIT) for the Quarter/s
        </div>
        <div className="b" style={{ borderTop: 0 }}>
          <L1 no="1" label="Gross Income Regular/Normal Rate – 1st Quarter" field="sch3_1" ro={comp.sch3_1 > 0 && !data.sch3_1} value={comp.sch3_1 > 0 && !data.sch3_1 ? comp.sch3_1 : undefined} />
          <L1 no="2" label="Gross Income Regular/Normal Rate – 2nd Quarter" field="sch3_2" ro={comp.sch3_2 > 0 && !data.sch3_2} value={comp.sch3_2 > 0 && !data.sch3_2 ? comp.sch3_2 : undefined} />
          <L1 no="3" label="Gross Income Regular/Normal Rate – 3rd Quarter" field="sch3_3" ro={comp.sch3_3 > 0 && !data.sch3_3} value={comp.sch3_3 > 0 && !data.sch3_3 ? comp.sch3_3 : undefined} />
          <L1 no="4" label="Total Gross Income (Sum of Items 1 to 3)" ro value={comp.sch3_4} strong />
          <div className="bir-line bt">
            <div className="num">5</div>
            <div className="desc">MCIT Rate</div>
            <div
              className="amtcell bl br"
              style={{ width: 220, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2, paddingRight: 6 }}
            >
              <span className="bir-rate ro" style={{ opacity: 0.7 }}>
                2
              </span>
              <span style={{ fontSize: 11, color: "#555" }}>%</span>
            </div>
          </div>
          <L1 no="6" label="Minimum Corporate Income Tax (To Schedule 2 Item 12)" ro value={comp.sch3_6} strong />
        </div>

        {/* Schedule 4 — Tax Credits / Payments */}
        <div className="bir-section b" style={{ borderTop: 0 }}>
          Schedule 4 – Tax Credits/Payments (attach additional sheet/s, if necessary)
        </div>
        <div className="b" style={{ borderTop: 0 }}>
          <L1 no="1" label="Prior Year’s Excess Credits" field="sch4_1" />
          <L1
            no="2"
            label="Tax payment/s for the previous quarter/s of the same taxable year other than MCIT"
            field="sch4_2"
          />
          <L1 no="3" label="MCIT payment/s for the previous quarter/s of the same taxable year" field="sch4_3" />
          <L1 no="4" label="Creditable Tax Withheld for the previous quarter/s" field="sch4_4" />
          <L1 no="5" label="Creditable Tax Withheld per BIR Form No. 2307 for this quarter" field="sch4_5" />
          <L1 no="6" label="Tax paid in return previously filed, if this is an amended return" field="sch4_6" />
          <L1 no="6a" label="Other Tax Credits/Payments (specify)" field="sch4_6a" />
          <L1 no="6b" label="Other Tax Credits/Payments (specify)" field="sch4_6b" />
          <L1
            no="7"
            label="Total Tax Credits/Payments (Sum of Items 1 to 6b) (To Part II Item 19)"
            ro
            value={comp.sch4_7}
            strong
            bg
          />
        </div>

        {comp.mcitApplies && (
          <div
            style={{
              marginTop: 6,
              fontSize: 10,
              color: "#b07a2e",
              background: "#fdf6ec",
              border: "1px solid #f0dcae",
              borderRadius: 6,
              padding: "6px 10px",
            }}
          >
            ⚠ MCIT (2% of gross income) exceeds the normal income tax — MCIT is used as the income tax due this quarter.
          </div>
        )}
        <div style={{ marginTop: 6, fontSize: 10, color: "#555" }}>
          Quarterly corporate income tax uses cumulative figures to date. Tax due is the higher of the normal tax (rate ×
          taxable income) or the 2% MCIT on gross income.
        </div>
      </div>

      {/* ============================ PAGE 3 — Rate / ATC reference ============================ */}
      <div className="bir-sheet">
        <BirHeader
          code="1702Q"
          date="January 2018 (ENCS)"
          page="3"
          title="Quarterly Income Tax Return"
          sub="For Corporations, Partnerships and Other Non-Individual Taxpayers"
          pcode="1702Q 01/18 ENCS P3"
        />
        <div className="bir-section b" style={{ borderTop: 0, textAlign: "center", fontWeight: 700 }}>
          Tax Rates / Alphanumeric Tax Codes (ATC) — for Item 5 reference
        </div>
        <div className="row" style={{ marginTop: 6, gap: 8 }}>
          <div className="grow">
            <table className="bir-taxtable">
              <thead>
                <tr>
                  <th colSpan={4}>DOMESTIC CORPORATION</th>
                </tr>
                <tr>
                  <th>ATC</th>
                  <th>Description</th>
                  <th>Tax Rate</th>
                  <th>Tax Base</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>IC 010</td><td>1a. In General</td><td>30% / 25%</td><td>Taxable Income from All Sources</td></tr>
                <tr><td>IC 055</td><td>1b. Minimum Corporate Income Tax</td><td>2%</td><td>Gross Income</td></tr>
                <tr><td>IC 030</td><td>2a. Proprietary Educational Institutions</td><td>10%</td><td>Taxable Income from All Sources</td></tr>
                <tr><td>IC 031</td><td>3a. Non-Stock, Non-Profit Hospitals</td><td>10%</td><td>Taxable Income from All Sources</td></tr>
                <tr><td>IC 040</td><td>4a. GOCC, Agencies &amp; Instrumentalities</td><td>30% / 25%</td><td>Taxable Income from All Sources</td></tr>
                <tr><td>IC 041</td><td>5a. National Gov’t &amp; LGU’s</td><td>30% / 25%</td><td>Taxable Income from Proprietary Activities</td></tr>
                <tr><td>IC 020</td><td>6a. Taxable Partnership</td><td>30% / 25%</td><td>Taxable Income from All Sources</td></tr>
                <tr><td>IC 011</td><td>7a. Exempt Corporation — On Exempt Activities</td><td>0%</td><td>—</td></tr>
                <tr><td>IC 010</td><td>7b. Exempt Corporation — On Taxable Activities</td><td>same as 1a</td><td>Taxable Income from All Sources</td></tr>
                <tr><td>IC 021</td><td>8. General Professional Partnership</td><td>exempt</td><td>—</td></tr>
                <tr><td>IC 200 / IC 210</td><td>9. Corporation covered by Special Law (PEZA / Microfinance NGOs)</td><td>0% / 5% / 2%</td><td>Gross Income / Gross Receipts</td></tr>
              </tbody>
            </table>
          </div>
          <div className="grow">
            <table className="bir-taxtable">
              <thead>
                <tr>
                  <th colSpan={4}>RESIDENT FOREIGN CORPORATION</th>
                </tr>
                <tr>
                  <th>ATC</th>
                  <th>Description</th>
                  <th>Tax Rate</th>
                  <th>Tax Base</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>IC 070</td><td>1a. In General</td><td>30% / 25%</td><td>Taxable Income from within the Philippines</td></tr>
                <tr><td>IC 055</td><td>1b. Minimum Corporate Income Tax</td><td>2%</td><td>Gross Income</td></tr>
                <tr><td>IC 080</td><td>2. International Carriers</td><td>2.5%</td><td>Gross Philippine Billing</td></tr>
                <tr><td>IC 101</td><td>3. Regional Operating Headquarters</td><td>10%</td><td>Taxable Income</td></tr>
                <tr><td>—</td><td>4. Corporation Covered by Special Law</td><td>special</td><td>—</td></tr>
                <tr><td>IC 190</td><td>5a. Offshore Banking Units — FCT not subject to Final Tax</td><td>10%</td><td>Gross Taxable Income on FCT</td></tr>
                <tr><td>IC 190</td><td>5b. Offshore Banking Units — Other than FCT</td><td>30%</td><td>Taxable Income other than FCT</td></tr>
                <tr><td>IC 191</td><td>6a. Foreign Currency Deposit Units — FCT not subject to Final Tax</td><td>10%</td><td>Gross Taxable Income on FCT</td></tr>
                <tr><td>IC 191</td><td>6b. Foreign Currency Deposit Units — Other than FCT</td><td>30%</td><td>Taxable Income other than FCT</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 9.6, color: "#555" }}>
          Normal Rate of Income Tax: 30% (pre-CREATE) / 25% (or 20% for qualified small corporations under CREATE).
          MCIT: 2% of gross income. *Please refer to the Revenue District Offices for special-law rates.
        </div>
      </div>
    </FormCtx.Provider>
  );
}

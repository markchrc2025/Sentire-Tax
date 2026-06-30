// Form1702RT.tsx — faithful 1702-RT replica (pages 1 & 2).
// Ported from form-1702RT.jsx.
// Annual ITR for Corporations/Partnerships — Regular Income Tax Rate (MCIT-aware).

import { createContext, useContext, type ReactNode } from "react";
import type { Comp1702RT } from "../../lib/compute";
import type { FormProps } from "../formProps";
import type { FilingData } from "../../types";
import { BirHeader, PartBand, PaymentDetails } from "../formparts";
import { BirAmt, BirBoxes, BirCkRow, BirText, BirVal, type SetFn } from "../formkit";

function fmtIncDate(iso?: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return m + "/" + d + "/" + y;
}

// ── form-wide context so the row helper below can live at MODULE scope.
//    Defining L1 inside the component gave each render a new component type,
//    which remounted every <input> on each keystroke and dropped the cursor. ──
interface Ctx1702RT {
  data: FilingData;
  set: SetFn;
}
const FormCtx = createContext<Ctx1702RT | null>(null);
const useF = () => useContext(FormCtx) as Ctx1702RT;

function L1({
  no,
  label,
  sub,
  field,
  ro,
  value,
  strong,
  bg,
  dim,
}: {
  no?: ReactNode;
  label: ReactNode;
  sub?: string;
  field?: string;
  ro?: boolean;
  value?: number;
  strong?: boolean;
  bg?: boolean;
  dim?: boolean;
}) {
  const { data, set } = useF();
  return (
    <div className="bir-line bt" style={bg ? { background: "var(--shade2)" } : undefined}>
      <div className="num">{no}</div>
      <div className="desc" style={{ fontWeight: strong ? 700 : 400, opacity: dim ? 0.5 : 1 }}>
        {label}
        {sub && <small> {sub}</small>}
      </div>
      <div className="amtcell bl br" style={{ width: 220 }}>
        <BirAmt field={field} data={data} set={set} ro={ro} value={value} dim={dim} />
      </div>
    </div>
  );
}

export function Form1702RT({ tp, data, set, comp }: FormProps<Comp1702RT>) {
  const pick = (f: string, v: string) => set(f, data[f] === v ? "" : v);
  const is = (f: string, v: string) => data[f] === v;
  const regName = tp
    ? tp.kind === "individual"
      ? [tp.lastName, tp.firstName].filter(Boolean).join(", ")
      : tp.regName
    : "";
  const incDate = tp && tp.incorpDate ? fmtIncDate(tp.incorpDate) : "";

  return (
    <FormCtx.Provider value={{ data, set }}>
      {/* PAGE 1 */}
      <div className="bir-sheet">
        <BirHeader
          code="1702-RT"
          date="January 2018 (ENCS)"
          page="1"
          title="Annual Income Tax Return"
          sub="Corporation, Partnership & Other Non-Individual Taxpayer — Subject Only to REGULAR Income Tax Rate"
          pcode="1702-RT 01/18 ENCS P1"
        />
        <div className="bir-instr bb b" style={{ borderTop: 0 }}>
          Enter all required information in CAPITAL LETTERS. Mark applicable boxes with an &ldquo;X&rdquo;. Two copies MUST
          be filed with the BIR and one held by the taxpayer.
        </div>

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
          <div className="bir-cell inline br" style={{ width: 220 }}>
            <span className="lblgrp">
              <span className="bir-ino">2</span> <span className="bir-cap">Year Ended (MM/YYYY)</span>
            </span>
            <div className="fld">
              <BirText field="year" data={data} set={set} placeholder="2024" />
            </div>
          </div>
          <div className="bir-cell inline br grow">
            <span className="lblgrp">
              <span className="bir-ino">3</span> <span className="bir-cap">Amended?</span>
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
              <span className="bir-ino">4</span> <span className="bir-cap">Short Period?</span>
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
              <BirVal value={tp ? [tp.address, tp.city].filter(Boolean).join(", ") : ""} />
            </div>
          </div>
          <div className="bir-cell inline" style={{ width: 150 }}>
            <span className="lblgrp">
              <span className="bir-ino">9A</span> <span className="bir-cap">ZIP</span>
            </span>
            <div className="fld">
              <BirVal value={tp?.zip} />
            </div>
          </div>
        </div>
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br" style={{ width: 340 }}>
            <span className="lblgrp">
              <span className="bir-ino">10</span> <span className="bir-cap">Date of Incorporation/Organization</span>
            </span>
            <div className="fld">
              <BirVal value={incDate} />
            </div>
          </div>
          <div className="bir-cell inline br" style={{ width: 250 }}>
            <span className="lblgrp">
              <span className="bir-ino">11</span> <span className="bir-cap">Contact Number</span>
            </span>
            <div className="fld">
              <BirVal value={tp?.phone} lower />
            </div>
          </div>
          <div className="bir-cell inline grow">
            <span className="lblgrp">
              <span className="bir-ino">12</span> <span className="bir-cap">Email</span>
            </span>
            <div className="fld">
              <BirVal value={tp?.email} lower />
            </div>
          </div>
        </div>
        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp">
            <span className="bir-ino">13</span> <span className="bir-cap">Method of Deductions</span>
          </span>
          <div className="fld" style={{ gap: 16 }}>
            <BirCkRow on={is("method", "itemized")} onClick={() => pick("method", "itemized")}>
              Itemized Deductions [Sec. 34(A-J), NIRC]
            </BirCkRow>
            <BirCkRow on={is("method", "osd")} onClick={() => pick("method", "osd")}>
              Optional Standard Deduction (OSD) — 40% of Gross Income
            </BirCkRow>
          </div>
        </div>

        <PartBand sub="(DO NOT enter Centavos)">Part II – Total Tax Payable</PartBand>
        <div className="b" style={{ borderTop: 0 }}>
          <L1 no="14" label="Tax Due (From Part IV Item 43)" ro value={comp.i14} strong />
          <L1 no="15" label="Less: Total Tax Credits/Payments (From Part IV Item 55)" ro value={comp.i15} />
          <L1 no="16" label="Net Tax Payable / (Overpayment) (Item 14 Less 15)" ro value={comp.i16} strong />
          <div className="bir-line bt">
            <div className="num"></div>
            <div className="desc" style={{ fontStyle: "italic", fontWeight: 700 }}>
              Add: Penalties
            </div>
            <div className="amtcell bl br" style={{ width: 220 }}></div>
          </div>
          <L1 no="17" label="Surcharge" field="i17" />
          <L1 no="18" label="Interest" field="i18" />
          <L1 no="19" label="Compromise" field="i19" />
          <L1 no="20" label="Total Penalties (Sum of Items 17 to 19)" ro value={comp.i20} strong />
          <L1
            no="21"
            label="TOTAL AMOUNT PAYABLE / (Overpayment) (Sum of Items 16 and 20)"
            ro
            value={comp.i21}
            strong
            bg
          />
        </div>

        <div className="bir-cell b" style={{ borderTop: 0 }}>
          <span className="bir-capi">
            If overpayment, mark one (1) box only. (Once the choice is made, the same is irrevocable)
          </span>
          <div className="row" style={{ gap: 20, marginTop: 3 }}>
            <BirCkRow on={is("over", "refund")} onClick={() => pick("over", "refund")}>
              To be refunded
            </BirCkRow>
            <BirCkRow on={is("over", "tcc")} onClick={() => pick("over", "tcc")}>
              To be issued a TCC
            </BirCkRow>
            <BirCkRow on={is("over", "carry")} onClick={() => pick("over", "carry")}>
              To be carried over as tax credit next year
            </BirCkRow>
          </div>
        </div>

        {/* signatories */}
        <div className="b" style={{ borderTop: 0 }}>
          <div className="bir-perjury bb">
            We declare under the penalties of perjury that this return, and all its attachments, have been made in good
            faith, verified by us, and to the best of our knowledge and belief, are true and correct, pursuant to the
            provisions of the National Internal Revenue Code, as amended.
          </div>
          <div className="row">
            <div className="bir-sign br grow" style={{ padding: "20px 6px 4px" }}>
              <BirVal value={regName} />
              <div style={{ borderTop: "0.7px solid var(--ln)", marginTop: 3, paddingTop: 3 }}>
                Signature over Printed Name of President/Principal Officer/Authorized Representative
              </div>
            </div>
            <div className="bir-sign grow" style={{ padding: "20px 6px 4px" }}>
              <BirText field="treasurer" data={data} set={set} />
              <div style={{ borderTop: "0.7px solid var(--ln)", marginTop: 3, paddingTop: 3 }}>
                Signature over Printed Name of Treasurer/Assistant Treasurer
              </div>
            </div>
          </div>
        </div>

        <PaymentDetails data={data} set={set} startNo={23} />
      </div>

      {/* PAGE 2 — Part IV Computation of Tax */}
      <div className="bir-sheet" data-rate={comp.method}>
        <BirHeader
          code="1702-RT"
          date="January 2018 (ENCS)"
          page="2"
          title="Annual Income Tax Return"
          sub="Corporation, Partnership & Other Non-Individual — Regular Income Tax Rate"
          pcode="1702-RT 01/18 ENCS P2"
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

        <PartBand>Part IV – Computation of Tax</PartBand>
        <div className="b" style={{ borderTop: 0 }}>
          <L1 no="27" label="Sales/Receipts/Revenues/Fees" field="i27" />
          <L1 no="28" label="Less: Sales Returns, Allowances and Discounts" field="i28" />
          <L1 no="29" label="Net Sales/Receipts (Item 27 Less 28)" ro value={comp.i29} />
          <L1 no="30" label="Less: Cost of Sales/Services" field="i30" />
          <L1 no="31" label="Gross Income from Operation (Item 29 Less 30)" ro value={comp.i31} strong />
          <L1 no="32" label="Add: Other Taxable Income Not Subjected to Final Tax" field="i32" />
          <L1 no="33" label="Total Taxable Income (Sum of Items 31 and 32)" ro value={comp.i33} strong />
          <div className="bir-line bt">
            <div className="num"></div>
            <div className="desc" style={{ fontStyle: "italic", fontWeight: 700 }}>
              Less: Deductions Allowable under Existing Law
            </div>
            <div className="amtcell bl br" style={{ width: 220 }}></div>
          </div>
          <L1 no="34" label="Ordinary Allowable Itemized Deductions" field="i34" dim={comp.method === "osd"} />
          <L1 no="35" label="Special Allowable Itemized Deductions" field="i35" dim={comp.method === "osd"} />
          <L1 no="36" label="NOLCO (only for those taxable under Sec. 27/28)" field="i36" dim={comp.method === "osd"} />
          <L1 no="37" label="Total Deductions (Sum of Items 34 to 36)" ro value={comp.i37} strong dim={comp.method === "osd"} />
          <L1
            no="38"
            label="OR: Optional Standard Deduction (OSD) — 40% of Item 33"
            ro
            value={comp.i38}
            strong
            dim={comp.method !== "osd"}
          />
          <L1 no="39" label="Net Taxable Income/(Loss) (Itemized: 33−37; OSD: 33−38)" ro value={comp.i39} strong />
          <div className="bir-line bt">
            <div className="num">40</div>
            <div className="desc">Applicable Income Tax Rate</div>
            <div
              className="amtcell bl br"
              style={{ width: 220, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2, paddingRight: 6 }}
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
          <L1 no="41" label="Income Tax Due other than MCIT (Item 39 × Item 40)" ro value={comp.i41} />
          <L1 no="42" label="MCIT Due (2% of Item 33)" ro value={comp.i42} />
          <L1 no="43" label="Tax Due (higher of Item 41 or 42) (To Part II Item 14)" ro value={comp.i43} strong bg />
          <div className="bir-line bt">
            <div className="num"></div>
            <div className="desc" style={{ fontStyle: "italic", fontWeight: 700 }}>
              Less: Tax Credits/Payments (attach proof)
            </div>
            <div className="amtcell bl br" style={{ width: 220 }}></div>
          </div>
          <L1 no="44" label="Prior Year’s Excess Credits other than MCIT" field="i44" />
          <L1 no="45" label="Income Tax Payment under MCIT from Previous Quarter/s" field="i45" />
          <L1 no="46" label="Income Tax Payment under Regular/Normal Rate from Previous Quarter/s" field="i46" />
          <L1 no="48" label="Creditable Tax Withheld from Previous Quarter/s (BIR Form 2307)" field="i48" />
          <L1 no="49" label="Creditable Tax Withheld per BIR Form 2307 for the 4th Quarter" field="i49" />
          <L1 no="50" label="Foreign Tax Credits, if applicable" field="i50" />
          <L1 no="51" label="Tax Paid in Return Previously Filed, if amended" field="i51" />
          <L1 no="55" label="Total Tax Credits/Payments (Sum of Items 44 to 54) (To Part II Item 15)" ro value={comp.i55} strong />
          <L1 no="56" label="Net Tax Payable / (Overpayment) (Item 43 Less 55)" ro value={comp.i56} strong bg />
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
            ⚠ MCIT (2% of gross income) exceeds the normal income tax — the MCIT amount is used as the Tax Due (Item 43).
          </div>
        )}
        <div style={{ marginTop: 6, fontSize: 10, color: "#555" }}>
          Regular corporate rate is <b>25%</b> (or <b>20%</b> if net taxable income ≤ ₱5M and total assets ≤ ₱100M,
          excluding land). Tax due is the higher of the normal tax or the 2% MCIT.
        </div>
      </div>
    </FormCtx.Provider>
  );
}

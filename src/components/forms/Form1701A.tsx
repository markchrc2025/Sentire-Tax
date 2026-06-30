// Form1701A.tsx — faithful 1701A replica (pages 1 & 2).
// Ported from form-1701A-p1.jsx + form-1701A-p2.jsx.

import { createContext, useContext, type ReactNode } from "react";
import type { Comp1701A } from "../../lib/compute";
import type { FormProps } from "../formProps";
import type { FilingData } from "../../types";
import { SEAL_SRC } from "../formparts";
import { BirAmt, BirBoxes, BirCkRow, BirText, BirVal, type SetFn } from "../formkit";
import { fmtAmt } from "../../lib/format";

function fmtDOB(iso?: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return m + "/" + d + "/" + y;
}

// ── form-wide context so the row helpers below can live at MODULE scope.
//    Defining them inside the page components gave each render a new component
//    type, which remounted every <input> on each keystroke and dropped the
//    cursor. ──
interface Ctx1701A {
  data: FilingData;
  set: SetFn;
}
const FormCtx = createContext<Ctx1701A | null>(null);
const useF = () => useContext(FormCtx) as Ctx1701A;

// ── Part II row: number | label | A amount | B amount (page 1) ──
function Row2({
  no,
  label,
  fieldBase,
  roA,
  roB,
  valA,
  valB,
  sub,
}: {
  no: string;
  label: string;
  fieldBase: string;
  roA?: boolean;
  roB?: boolean;
  valA?: number;
  valB?: number;
  sub?: string;
}) {
  const { data, set } = useF();
  return (
    <div className="bir-line bt">
      <div className="num">{no}</div>
      <div className="desc">
        {label}
        {sub && <small> {sub}</small>}
      </div>
      <div className="amtcell bl br">
        <BirAmt field={fieldBase + "A"} data={data} set={set} ro={roA} value={valA} />
      </div>
      <div className="amtcell">
        <BirAmt field={fieldBase + "B"} data={data} set={set} ro={roB} value={valB} />
      </div>
    </div>
  );
}

// ── Part IV computation row: number | label | A amount | B amount (page 2) ──
function CRow({
  no,
  label,
  sub,
  base,
  roA,
  roB,
  valA,
  valB,
  strong,
  indent,
}: {
  no: string;
  label: ReactNode;
  sub?: string;
  base: string;
  roA?: boolean;
  roB?: boolean;
  valA?: number;
  valB?: number;
  strong?: boolean;
  indent?: boolean;
}) {
  const { data, set } = useF();
  return (
    <div className="bir-line bt">
      <div className="num">{no}</div>
      <div className="desc" style={{ fontWeight: strong ? 700 : 400, paddingLeft: indent ? 14 : 4 }}>
        {label}
        {sub && <small> {sub}</small>}
      </div>
      <div className="amtcell bl br">
        <BirAmt field={base + "A"} data={data} set={set} ro={roA} value={valA} />
      </div>
      <div className="amtcell br">
        <BirAmt field={base + "B"} data={data} set={set} ro={roB} value={valB} />
      </div>
    </div>
  );
}

function Form1701A_P1({ tp, data, set, comp }: FormProps<Comp1701A>) {
  const pick = (f: string, v: string) => set(f, data[f] === v ? "" : v);
  const is = (f: string, v: string) => data[f] === v;
  const name = tp
    ? tp.kind === "individual"
      ? [tp.lastName, tp.firstName, tp.middleName].filter(Boolean).join(", ")
      : tp.regName
    : "";

  return (
    <FormCtx.Provider value={{ data, set }}>
    <div className="bir-sheet bir-1701a-p1">
      {/* ===== HEADER ===== */}
      <div className="row b">
        <div className="bir-formno br">
          <div className="lbl">BIR Form No.</div>
          <div className="no">1701A</div>
          <div className="date">January 2018</div>
          <div className="page">Page 1</div>
        </div>
        <div className="grow col">
          <div
            className="bir-gov bb"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "3px 14px", minHeight: 44 }}
          >
            <img src={SEAL_SRC} alt="BIR" style={{ width: 50, height: 50, flex: "none" }} />
            <div style={{ textAlign: "center" }}>
              <div className="rep">Republic of the Philippines</div>
              <div className="dof">Department of Finance</div>
              <div className="bureau">Bureau of Internal Revenue</div>
            </div>
          </div>
          <div className="bir-title">
            <div className="t">Annual Income Tax Return</div>
            <div className="sub">
              Individuals Earning Income PURELY from Business/Profession
              <br />
              <i>
                [Those under the graduated income tax rates with OSD as mode of deduction OR those who opted to avail
                of the 8% flat income tax rate]
              </i>
            </div>
          </div>
        </div>
        <div className="col bl" style={{ width: 96, flex: "none" }}>
          <div className="bir-foot" style={{ padding: "3px 4px", borderBottom: "0.8px solid var(--ln)", flex: 1 }}>
            <b>For BIR Use Only</b>
            <br />
            BCS/
            <br />
            Item:
          </div>
          <div style={{ fontSize: 7, padding: "2px 4px", textAlign: "center" }}>1701A 01/18 P1</div>
        </div>
      </div>

      <div className="bir-instr bb b" style={{ borderTop: 0 }}>
        Enter all required information in CAPITAL LETTERS using BLACK ink. Mark applicable boxes with an &ldquo;X&rdquo;.
        Two copies must be filed with the BIR and one held by the Tax Filer.
      </div>

      {/* line 1-2-3 */}
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br grow">
          <span className="lblgrp">
            <span className="bir-ino">1</span> <span className="bir-cap">For the Year (MM/YYYY)</span>
          </span>
          <div className="fld">
            <BirText field="year" data={data} set={set} placeholder="2024" />
          </div>
        </div>
        <div className="bir-cell inline br" style={{ width: 230 }}>
          <span className="lblgrp">
            <span className="bir-ino">2</span> <span className="bir-cap">Amended Return?</span>
          </span>
          <div className="fld" style={{ gap: 14 }}>
            <BirCkRow on={is("amended", "yes")} onClick={() => pick("amended", "yes")}>
              Yes
            </BirCkRow>
            <BirCkRow on={is("amended", "no")} onClick={() => pick("amended", "no")}>
              No
            </BirCkRow>
          </div>
        </div>
        <div className="bir-cell inline" style={{ width: 230 }}>
          <span className="lblgrp">
            <span className="bir-ino">3</span> <span className="bir-cap">Short Period Return?</span>
          </span>
          <div className="fld" style={{ gap: 14 }}>
            <BirCkRow on={is("shortPeriod", "yes")} onClick={() => pick("shortPeriod", "yes")}>
              Yes
            </BirCkRow>
            <BirCkRow on={is("shortPeriod", "no")} onClick={() => pick("shortPeriod", "no")}>
              No
            </BirCkRow>
          </div>
        </div>
      </div>

      <div className="bir-part b" style={{ borderTop: 0 }}>
        Part I – Background Information on Taxpayer/Filer
      </div>

      {/* 4 TIN | 5 RDO | 6 type */}
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell br" style={{ width: 340 }}>
          <span className="bir-ino">4</span> <span className="bir-cap">Taxpayer Identification Number (TIN)</span>
          <div style={{ marginTop: 3 }}>
            <BirBoxes value={(tp && tp.tin) || ""} count={14} groups={[3, 3, 3, 5]} />
          </div>
        </div>
        <div className="bir-cell br" style={{ width: 110 }}>
          <span className="bir-ino">5</span> <span className="bir-cap">RDO Code</span>
          <div style={{ marginTop: 3 }}>
            <BirBoxes value={(tp && tp.rdo) || ""} count={3} />
          </div>
        </div>
        <div className="bir-cell inline grow">
          <span className="lblgrp">
            <span className="bir-ino">6</span> <span className="bir-cap">Taxpayer Type</span>
          </span>
          <div className="fld" style={{ gap: 16 }}>
            <BirCkRow on={is("taxpayerType", "single")} onClick={() => pick("taxpayerType", "single")}>
              Single Proprietor
            </BirCkRow>
            <BirCkRow on={is("taxpayerType", "prof")} onClick={() => pick("taxpayerType", "prof")}>
              Professional
            </BirCkRow>
          </div>
        </div>
      </div>

      {/* 7 ATC */}
      <div className="bir-cell inline b" style={{ borderTop: 0, alignItems: "flex-start" }}>
        <span className="lblgrp" style={{ paddingTop: 4 }}>
          <span className="bir-ino">7</span> <span className="bir-cap">Alphanumeric Tax Code (ATC)</span>
        </span>
        <div className="fld atc-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 18px" }}>
          <BirCkRow on={is("atc", "II012")} onClick={() => pick("atc", "II012")}>
            <b>II012</b>&nbsp;Business Income - Graduated IT Rates
          </BirCkRow>
          <BirCkRow on={is("atc", "II014")} onClick={() => pick("atc", "II014")}>
            <b>II014</b>&nbsp;Income from Profession – Graduated IT Rates
          </BirCkRow>
          <BirCkRow on={is("atc", "II015")} onClick={() => pick("atc", "II015")}>
            <b>II015</b>&nbsp;Business Income - 8% IT Rate
          </BirCkRow>
          <BirCkRow on={is("atc", "II017")} onClick={() => pick("atc", "II017")}>
            <b>II017</b>&nbsp;Income from Profession – 8% IT Rate
          </BirCkRow>
        </div>
      </div>

      {/* 8 name */}
      <div className="bir-cell inline b" style={{ borderTop: 0 }}>
        <span className="lblgrp">
          <span className="bir-ino">8</span>{" "}
          <span className="bir-cap">Taxpayer&rsquo;s Name (Last Name, First Name, Middle Name)</span>
        </span>
        <div className="fld">
          <BirVal value={name} />
        </div>
      </div>

      {/* 9 address | 9A zip */}
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
            <span className="bir-ino">9A</span> <span className="bir-cap">ZIP Code</span>
          </span>
          <div className="fld">
            <BirVal value={tp?.zip} />
          </div>
        </div>
      </div>

      {/* 10 dob | 11 email */}
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br" style={{ width: 270 }}>
          <span className="lblgrp">
            <span className="bir-ino">10</span> <span className="bir-cap">Date of Birth (MM/DD/YYYY)</span>
          </span>
          <div className="fld">
            <BirVal value={tp && tp.birthdate ? fmtDOB(tp.birthdate) : ""} />
          </div>
        </div>
        <div className="bir-cell inline grow">
          <span className="lblgrp">
            <span className="bir-ino">11</span> <span className="bir-cap">Email Address</span>
          </span>
          <div className="fld">
            <BirVal value={tp?.email} lower />
          </div>
        </div>
      </div>

      {/* 12 citizenship | 13 foreign credits | 14 foreign tax no */}
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br" style={{ width: 220 }}>
          <span className="lblgrp">
            <span className="bir-ino">12</span> <span className="bir-cap">Citizenship</span>
          </span>
          <div className="fld">
            <BirVal value={tp?.citizenship} />
          </div>
        </div>
        <div className="bir-cell inline br grow">
          <span className="lblgrp">
            <span className="bir-ino">13</span> <span className="bir-cap">Claiming Foreign Tax Credits?</span>
          </span>
          <div className="fld" style={{ gap: 14 }}>
            <BirCkRow on={is("foreignCredit", "yes")} onClick={() => pick("foreignCredit", "yes")}>
              Yes
            </BirCkRow>
            <BirCkRow on={is("foreignCredit", "no")} onClick={() => pick("foreignCredit", "no")}>
              No
            </BirCkRow>
          </div>
        </div>
        <div className="bir-cell inline" style={{ width: 230 }}>
          <span className="lblgrp">
            <span className="bir-ino">14</span> <span className="bir-cap">Foreign Tax Number</span>
          </span>
          <div className="fld">
            <BirText field="foreignTaxNo" data={data} set={set} />
          </div>
        </div>
      </div>

      {/* 15 contact | 16 civil status */}
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br" style={{ width: 270 }}>
          <span className="lblgrp">
            <span className="bir-ino">15</span> <span className="bir-cap">Contact Number</span>
          </span>
          <div className="fld">
            <BirVal value={tp?.phone} lower />
          </div>
        </div>
        <div className="bir-cell inline grow">
          <span className="lblgrp">
            <span className="bir-ino">16</span> <span className="bir-cap">Civil Status</span>
          </span>
          <div className="fld" style={{ gap: 12 }}>
            <BirCkRow on={is("civil", "single")} onClick={() => pick("civil", "single")}>
              Single
            </BirCkRow>
            <BirCkRow on={is("civil", "married")} onClick={() => pick("civil", "married")}>
              Married
            </BirCkRow>
            <BirCkRow on={is("civil", "sep")} onClick={() => pick("civil", "sep")}>
              Legally Separated
            </BirCkRow>
            <BirCkRow on={is("civil", "widow")} onClick={() => pick("civil", "widow")}>
              Widow/er
            </BirCkRow>
          </div>
        </div>
      </div>

      {/* 17 spouse income | 18 filing status */}
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br grow">
          <span className="lblgrp">
            <span className="bir-ino">17</span> <span className="bir-cap">If married, spouse has income?</span>
          </span>
          <div className="fld" style={{ gap: 14 }}>
            <BirCkRow on={is("spouseIncome", "yes")} onClick={() => pick("spouseIncome", "yes")}>
              Yes
            </BirCkRow>
            <BirCkRow on={is("spouseIncome", "no")} onClick={() => pick("spouseIncome", "no")}>
              No
            </BirCkRow>
          </div>
        </div>
        <div className="bir-cell inline" style={{ width: 320 }}>
          <span className="lblgrp">
            <span className="bir-ino">18</span> <span className="bir-cap">Filing Status</span>
          </span>
          <div className="fld" style={{ gap: 18 }}>
            <BirCkRow on={is("filing", "joint")} onClick={() => pick("filing", "joint")}>
              Joint Filing
            </BirCkRow>
            <BirCkRow on={is("filing", "separate")} onClick={() => pick("filing", "separate")}>
              Separate Filing
            </BirCkRow>
          </div>
        </div>
      </div>

      {/* 19 tax rate */}
      <div className="bir-cell inline b" style={{ borderTop: 0, alignItems: "flex-start" }}>
        <span className="lblgrp" style={{ paddingTop: 4 }}>
          <span className="bir-ino">19</span> <span className="bir-cap">Tax Rate</span>
        </span>
        <div className="fld col" style={{ gap: 3, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <BirCkRow on={is("taxRate", "graduated")} onClick={() => pick("taxRate", "graduated")}>
            Graduated rates with OSD as method of deduction
          </BirCkRow>
          <BirCkRow on={is("taxRate", "eight")} onClick={() => pick("taxRate", "eight")}>
            8% in lieu of Graduated Rates under Sec. 24(A) &amp; Percentage Tax under Sec. 116 of NIRC{" "}
            <i>[available if gross sales/receipts and other non-operating income do not exceed Three million pesos (P3M)]</i>
          </BirCkRow>
        </div>
      </div>

      {/* ===== PART II ===== */}
      <div className="bir-part b" style={{ borderTop: 0 }}>
        Part II – Total Tax Payable{" "}
        <span style={{ fontWeight: 400, fontStyle: "italic" }}>
          (DO NOT enter Centavos; 49 Centavos or Less drop down; 50 or more round up)
        </span>
      </div>
      <div className="row b" style={{ borderTop: 0, background: "var(--shade2)", alignItems: "stretch", minHeight: 26 }}>
        <div className="num" style={{ width: 28, flex: "none" }}></div>
        <div className="desc" style={{ flex: 1, fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", padding: "3px 6px" }}>
          Particulars
        </div>
        <div className="amtcell bl br bir-amthead" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          A) Taxpayer/Filer
        </div>
        <div className="amtcell bir-amthead" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          B) Spouse
        </div>
      </div>
      <div className="b" style={{ borderTop: 0 }}>
        <Row2 no="20" label="Tax Due" sub="(Either from Part IV.A Item 46 OR Part IV.B Item 56)" fieldBase="i20" roA roB valA={comp.A.i20} valB={comp.B.i20} />
        <Row2 no="21" label="Less: Total Tax Credits/Payments" sub="(From Part IV.C Item 64)" fieldBase="i21" roA roB valA={comp.A.i21} valB={comp.B.i21} />
        <Row2 no="22" label="Net Tax Payable/(Overpayment)" sub="(Item 20 Less Item 21)" fieldBase="i22" roA roB valA={comp.A.i22} valB={comp.B.i22} />
        <Row2 no="23" label="Less: Portion of Tax Payable Allowed for 2nd Installment (50% or less of Item 20)" fieldBase="i23" valA={comp.A.i23} valB={comp.B.i23} />
        <Row2 no="24" label="Amount of Tax Payable/(Overpayment)" sub="(Item 22 Less Item 23)" fieldBase="i24" roA roB valA={comp.A.i24} valB={comp.B.i24} />
        <div className="bir-line bt">
          <div className="num"></div>
          <div className="desc" style={{ fontWeight: 700, fontStyle: "italic" }}>
            Add: Penalties
          </div>
          <div className="amtcell bl br"></div>
          <div className="amtcell"></div>
        </div>
        <Row2 no="25" label="Surcharge" fieldBase="i25" valA={comp.A.i25} valB={comp.B.i25} />
        <Row2 no="26" label="Interest" fieldBase="i26" valA={comp.A.i26} valB={comp.B.i26} />
        <Row2 no="27" label="Compromise" fieldBase="i27" valA={comp.A.i27} valB={comp.B.i27} />
        <Row2 no="28" label="Total Penalties (Sum of Items 25 to 27)" fieldBase="i28" roA roB valA={comp.A.i28} valB={comp.B.i28} />
        <Row2 no="29" label="Total Amount Payable/(Overpayment) (Sum of Items 24 and 28)" fieldBase="i29" roA roB valA={comp.A.i29} valB={comp.B.i29} />
        <div className="bir-line bt" style={{ background: "var(--shade2)" }}>
          <div className="num">30</div>
          <div className="desc" style={{ fontWeight: 700 }}>
            Aggregate Amount Payable/(Overpayment) (Sum of Items 29A &amp; 29B)
          </div>
          {/* Aggregate (29A + 29B) is a single value spanning both columns,
              centered — no internal A|B divider for this row. */}
          <div className="amtcell bl" style={{ width: 376, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#16263a", fontVariantNumeric: "tabular-nums" }}>
              {fmtAmt(comp.i30)}
            </span>
          </div>
        </div>
      </div>

      {/* overpayment options */}
      <div className="bir-cell b" style={{ borderTop: 0 }}>
        <span className="bir-capi">
          If overpayment, mark one (1) box only. (Once the choice is made, the same is irrevocable)
        </span>
        <div className="row" style={{ gap: 20, marginTop: 3 }}>
          <BirCkRow on={is("over", "refund")} onClick={() => pick("over", "refund")}>
            To be refunded
          </BirCkRow>
          <BirCkRow on={is("over", "tcc")} onClick={() => pick("over", "tcc")}>
            To be issued a Tax Credit Certificate (TCC)
          </BirCkRow>
          <BirCkRow on={is("over", "carry")} onClick={() => pick("over", "carry")}>
            To be carried over as a tax credit for next year/quarter
          </BirCkRow>
        </div>
      </div>

      {/* perjury + signature (left) | attachments (right) */}
      <div className="row b" style={{ borderTop: 0, minHeight: 132 }}>
        <div className="col br grow">
          <div className="bir-perjury bb" style={{ flex: 1 }}>
            I declare under the penalties of perjury that this return, and all its attachments, have been made in good
            faith, verified by me, and to the best of my knowledge and belief, are true and correct, pursuant to the
            provisions of the National Internal Revenue Code, as amended, and the regulations issued under authority
            thereof. Further, I give my consent to the processing of my information as contemplated under the *Data
            Privacy Act of 2012 (R.A. No. 10173) for legitimate and lawful purposes. (If signed by an Authorized
            Representative, indicate TIN and attach authorization letter)
          </div>
          <div className="bir-sign" style={{ padding: "6px 6px 3px" }}>
            <BirVal value={name} />
            <div style={{ borderTop: "0.7px solid var(--ln)", marginTop: 3, paddingTop: 3 }}>
              Printed Name and Signature of Taxpayer/Authorized Representative
            </div>
          </div>
        </div>
        <div className="bir-cell" style={{ width: 250, flex: "none" }}>
          <span className="bir-ino">31</span> <span className="bir-cap">Number of Attachments</span>
          <div style={{ width: 120, marginTop: 6 }}>
            <BirText field="attachments" data={data} set={set} />
          </div>
        </div>
      </div>

      {/* part III payment */}
      <div className="bir-part b" style={{ borderTop: 0 }}>
        Part III - Details of Payment
      </div>
      <div className="row b" style={{ borderTop: 0, background: "var(--shade2)", fontSize: 9.6, fontWeight: 700 }}>
        <div style={{ width: 180, padding: "3px 5px" }} className="br">
          Particulars
        </div>
        <div className="grow br" style={{ padding: "3px 5px" }}>
          Drawee Bank/Agency
        </div>
        <div style={{ width: 130, padding: "3px 5px" }} className="br">
          Number
        </div>
        <div style={{ width: 120, padding: "3px 5px" }} className="br">
          Date (MM/DD/YYYY)
        </div>
        <div style={{ width: 130, padding: "3px 5px", textAlign: "center" }}>Amount</div>
      </div>
      {(
        [
          ["32", "Cash/Bank Debit Memo", "p32"],
          ["33", "Check", "p33"],
          ["34", "Tax Debit Memo", "p34"],
          ["35", "Others (specify below)", "p35"],
        ] as Array<[string, string, string]>
      ).map(([no, lbl, k]) => (
        <div className="row b" style={{ borderTop: 0, minHeight: 34 }} key={k}>
          <div style={{ width: 180 }} className="bir-cell br">
            <span className="bir-ino">{no}</span> <span className="bir-cap">{lbl}</span>
          </div>
          <div className="grow br">
            <BirText field={k + "bank"} data={data} set={set} />
          </div>
          <div style={{ width: 130 }} className="br">
            <BirText field={k + "num"} data={data} set={set} />
          </div>
          <div style={{ width: 120 }} className="br">
            <BirText field={k + "date"} data={data} set={set} lower />
          </div>
          <div style={{ width: 130 }}>
            <BirAmt field={k + "amt"} data={data} set={set} />
          </div>
        </div>
      ))}
      <div className="bir-foot b" style={{ borderTop: 0, display: "flex", minHeight: 104 }}>
        <div className="grow br" style={{ padding: "5px 7px" }}>
          Machine Validation/Revenue Official Receipt Details (if not filed with an Authorized Agent Bank)
        </div>
        <div style={{ width: 300, padding: "5px 7px" }}>
          Stamp of Receiving Office/AAB and Date of Receipt (RO&rsquo;s Signature/Bank Teller&rsquo;s Initial)
        </div>
      </div>
      <div style={{ fontSize: 9, fontWeight: 700, padding: "4px 2px 0" }}>
        *NOTE: The BIR Data Privacy Policy is in the BIR website (www.bir.gov.ph)
      </div>
    </div>
    </FormCtx.Provider>
  );
}

function Form1701A_P2({ tp, data, set, comp }: FormProps<Comp1701A>) {
  const pick = (f: string, v: string) => set(f, data[f] === v ? "" : v);
  const is = (f: string, v: string) => data[f] === v;
  const lastName = tp ? (tp.kind === "individual" ? tp.lastName : tp.regName) : "";

  return (
    <FormCtx.Provider value={{ data, set }}>
    <div className="bir-sheet bir-1701a-p2" data-rate={(data.taxRate as string) || "graduated"}>
      {/* header strip */}
      <div className="row b">
        <div className="bir-formno br">
          <div className="lbl">BIR Form No.</div>
          <div className="no">1701A</div>
          <div className="date">January 2018</div>
          <div className="page">Page 2</div>
        </div>
        <div className="grow bir-title" style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "4px 8px" }}>
          <div className="t">Annual Income Tax Return</div>
          <div className="sub">
            Individuals Earning Income PURELY from Business/Profession
            <br />
            <i>
              [Those under the graduated income tax rates with OSD as mode of deduction OR those who opted to avail of
              the 8% flat income tax rate]
            </i>
          </div>
        </div>
        <div className="bl col" style={{ width: 96, flex: "none" }}>
          <div className="grow" style={{ padding: 4 }}>
            <div style={{ fontSize: 8 }}>
              <b>For BIR Use Only</b>
              <br />
              BCS/
              <br />
              Item:
            </div>
          </div>
          <div style={{ fontSize: 8, padding: "2px 4px", textAlign: "right" }}>1701A 01/18 P2</div>
        </div>
      </div>

      {/* TIN / Last Name band */}
      <div className="row b" style={{ borderTop: 0, background: "var(--shade2)" }}>
        <div className="grow br" style={{ padding: "2px 6px" }}>
          <span className="bir-cap" style={{ fontWeight: 700 }}>
            TIN
          </span>
        </div>
        <div style={{ width: 360, flex: "none", padding: "2px 6px" }}>
          <span className="bir-cap" style={{ fontWeight: 700 }}>
            Tax Filer&rsquo;s Last Name
          </span>
        </div>
      </div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell br grow" style={{ minHeight: 24, display: "flex", alignItems: "center" }}>
          <BirBoxes value={(tp && tp.tin) || ""} count={14} groups={[3, 3, 3, 5]} />
        </div>
        <div className="bir-cell" style={{ width: 360, flex: "none", minHeight: 24, display: "flex", alignItems: "center" }}>
          <BirVal value={lastName} />
        </div>
      </div>

      <div className="bir-part b" style={{ borderTop: 0 }}>
        Part IV – Computation of Income Tax
      </div>
      <div className="bir-instr b" style={{ borderTop: 0 }}>
        If Optional Standard Deductions (OSD), fill in items 36 to 46; if 8%, fill in items 47 to 56 (DO NOT enter
        Centavos; 49 Centavos or Less drop down; 50 or more round up)
      </div>

      {/* IV.A header */}
      <div className="row b" style={{ borderTop: 0, background: "var(--shade2)", alignItems: "stretch" }}>
        <div className="grow" style={{ fontWeight: 700, fontSize: 10.6, display: "flex", alignItems: "center", padding: "2px 8px" }}>
          IV.A – For Graduated Income Tax Rates
        </div>
        <div className="amtcell bl br bir-amthead" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          A) Taxpayer/Filer
        </div>
        <div className="amtcell br bir-amthead" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          B) Spouse
        </div>
      </div>
      <div className="b when-grad" style={{ borderTop: 0 }}>
        <CRow no="36" label="Sales/Revenues/Receipts/Fees" base="i36" valA={comp.A.i36} valB={comp.B.i36} />
        <CRow no="37" label="Less: Sales Returns, Allowances and Discounts" base="i37" valA={comp.A.i37} valB={comp.B.i37} />
        <CRow no="38" label="Net Sales/Revenues/Receipts/Fees" sub="(Item 36 Less Item 37)" base="i38" roA roB valA={comp.A.i38} valB={comp.B.i38} />
        <CRow no="39" label="Less: Allowable Deduction - Optional Standard Deduction (OSD)" sub="(40% of Item 38)" base="i39" roA roB valA={comp.A.i39} valB={comp.B.i39} />
        <CRow no="40" label="Net Income (Item 38 Less Item 39)" base="i40" roA roB valA={comp.A.i40} valB={comp.B.i40} />
        <div className="bir-line bt">
          <div className="num"></div>
          <div className="desc" style={{ fontStyle: "italic", fontWeight: 700 }}>
            Add: Other Non-Operating Income (specify below)
          </div>
          <div className="amtcell bl br"></div>
          <div className="amtcell br"></div>
        </div>
        <CRow no="41" label={<BirText field="i41label" data={data} set={set} />} base="i41" valA={comp.A.i41} valB={comp.B.i41} />
        <CRow no="42" label={<BirText field="i42label" data={data} set={set} />} base="i42" valA={comp.A.i42} valB={comp.B.i42} />
        <CRow no="43" label="Amount Received/Share in Income by a Partner from General Professional Partnership (GPP)" base="i43" valA={comp.A.i43} valB={comp.B.i43} />
        <CRow no="44" label="Total Other Income (Sum of Items 41 to 43)" base="i44" roA roB valA={comp.A.i44} valB={comp.B.i44} />
        <CRow no="45" label="Total Taxable Income (Sum of Items 40 and 44)" base="i45" roA roB valA={comp.A.i45} valB={comp.B.i45} strong />
        <CRow no="46" label="TAX DUE (Item 45 x Applicable Tax Rate based on Tax Table below) (To Part II – Item 20)" base="i46" roA roB valA={comp.A.i46} valB={comp.B.i46} strong />
      </div>

      {/* IV.B header */}
      <div className="row b" style={{ borderTop: 0, background: "var(--shade2)", alignItems: "stretch" }}>
        <div className="grow" style={{ fontWeight: 700, fontSize: 10.6, display: "flex", alignItems: "center", padding: "2px 8px" }}>
          IV.B – For 8% Income Tax Rate{" "}
          <span style={{ fontWeight: 400, fontStyle: "italic", marginLeft: 4 }}>
            (opted at the initial quarter; sales/receipts did not exceed P3M)
          </span>
        </div>
        <div className="amtcell bl br"></div>
        <div className="amtcell br"></div>
      </div>
      <div className="b when-eight" style={{ borderTop: 0 }}>
        <CRow no="47" label="Sales/Revenues/Receipts/Fees" base="i47" valA={comp.A.i47} valB={comp.B.i47} />
        <CRow no="48" label="Less: Sales Returns, Allowances and Discounts" base="i48" valA={comp.A.i48} valB={comp.B.i48} />
        <CRow no="49" label="Net Sales/Revenues/Receipts/Fees (Item 47 Less Item 48)" base="i49" roA roB valA={comp.A.i49} valB={comp.B.i49} />
        <div className="bir-line bt">
          <div className="num"></div>
          <div className="desc" style={{ fontStyle: "italic", fontWeight: 700 }}>
            Add: Other Non-Operating Income (specify below)
          </div>
          <div className="amtcell bl br"></div>
          <div className="amtcell br"></div>
        </div>
        <CRow no="50" label={<BirText field="i50label" data={data} set={set} />} base="i50" valA={comp.A.i50} valB={comp.B.i50} />
        <CRow no="51" label={<BirText field="i51label" data={data} set={set} />} base="i51" valA={comp.A.i51} valB={comp.B.i51} />
        <CRow no="52" label="Total Other Non-operating Income (Sum of Items 50 and 51)" base="i52" roA roB valA={comp.A.i52} valB={comp.B.i52} />
        <CRow no="53" label="Total Taxable Income (Sum of Items 49 and 52)" base="i53" roA roB valA={comp.A.i53} valB={comp.B.i53} />
        <CRow no="54" label="Less: Allowable reduction of P 250,000 (purely self-employed individuals and/or professionals)" base="i54" roA roB valA={comp.A.i54} valB={comp.B.i54} />
        <CRow no="55" label="Taxable Income/(Loss) (Item 53 Less Item 54)" base="i55" roA roB valA={comp.A.i55} valB={comp.B.i55} strong />
        <CRow no="56" label="TAX DUE (Item 55 x 8% Income Tax Rate) (To Part II - Item 20)" base="i56" roA roB valA={comp.A.i56} valB={comp.B.i56} strong />
      </div>

      {/* IV.C credits */}
      <div className="bir-section b" style={{ borderTop: 0 }}>
        IV.C - Tax Credits/Payments (attach proof)
      </div>
      <div className="b" style={{ borderTop: 0 }}>
        <CRow no="57" label="Prior Year&rsquo;s Excess Credits" base="i57" valA={comp.A.i57} valB={comp.B.i57} />
        <CRow no="58" label="Tax Payments for the First Three (3) Quarters" base="i58" valA={comp.A.i58} valB={comp.B.i58} />
        <CRow no="59" label="Creditable Tax Withheld for the First Three (3) Quarters" base="i59" valA={comp.A.i59} valB={comp.B.i59} />
        <CRow no="60" label="Creditable Tax Withheld per BIR Form No. 2307 for the 4th Quarter" base="i60" valA={comp.A.i60} valB={comp.B.i60} />
        <CRow no="61" label="Tax Paid in Return Previously Filed, if this is an Amended Return" base="i61" valA={comp.A.i61} valB={comp.B.i61} />
        <CRow no="62" label="Foreign Tax Credits, if applicable" base="i62" valA={comp.A.i62} valB={comp.B.i62} />
        <CRow no="63" label="Other Tax Credits/Payments (specify)" base="i63" valA={comp.A.i63} valB={comp.B.i63} />
        <CRow no="64" label="Total Tax Credits/Payments (Sum of Items 57 to 63) (To Item 21)" base="i64" roA roB valA={comp.A.i64} valB={comp.B.i64} strong />
        <CRow no="65" label="Net Tax Payable/(Overpayment) (Item 46 OR 56 Less Item 64) (To Part II - Item 22)" base="i65" roA roB valA={comp.A.i65} valB={comp.B.i65} strong />
      </div>

      {/* Part V spouse background */}
      <div className="bir-part b" style={{ borderTop: 0 }}>
        Part V – Background Information on Spouse
      </div>

      {/* 66 TIN | 67 RDO | 68 spouse type */}
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell br" style={{ width: 340 }}>
          <span className="bir-ino">66</span>{" "}
          <span className="bir-cap">Spouse&rsquo;s Taxpayer Identification Number (TIN)</span>
          <div style={{ marginTop: 3 }}>
            <BirBoxes value={(data.spouseTin as string) || ""} count={14} groups={[3, 3, 3, 5]} />
          </div>
        </div>
        <div className="bir-cell br" style={{ width: 96 }}>
          <span className="bir-ino">67</span> <span className="bir-cap">RDO Code</span>
          <div style={{ marginTop: 3 }}>
            <BirBoxes value={(data.spouseRdo as string) || ""} count={3} />
          </div>
        </div>
        <div className="bir-cell grow">
          <span className="bir-ino">68</span> <span className="bir-cap">Filer&rsquo;s Spouse Type</span>
          <div className="row" style={{ gap: 16, marginTop: 3 }}>
            <BirCkRow on={is("spouseType", "single")} onClick={() => pick("spouseType", "single")}>
              Single Proprietor
            </BirCkRow>
            <BirCkRow on={is("spouseType", "prof")} onClick={() => pick("spouseType", "prof")}>
              Professional
            </BirCkRow>
          </div>
        </div>
      </div>

      {/* 69 spouse ATC */}
      <div className="bir-cell inline b" style={{ borderTop: 0, alignItems: "flex-start" }}>
        <span className="lblgrp" style={{ paddingTop: 4 }}>
          <span className="bir-ino">69</span> <span className="bir-cap">Alphanumeric Tax Code (ATC)</span>
        </span>
        <div className="fld atc-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 18px" }}>
          <BirCkRow on={is("spouseAtc", "II012")} onClick={() => pick("spouseAtc", "II012")}>
            <b>II012</b>&nbsp;Business Income - Graduated IT Rates
          </BirCkRow>
          <BirCkRow on={is("spouseAtc", "II014")} onClick={() => pick("spouseAtc", "II014")}>
            <b>II014</b>&nbsp;Income from Profession – Graduated IT Rates
          </BirCkRow>
          <BirCkRow on={is("spouseAtc", "II015")} onClick={() => pick("spouseAtc", "II015")}>
            <b>II015</b>&nbsp;Business Income - 8% IT Rate
          </BirCkRow>
          <BirCkRow on={is("spouseAtc", "II017")} onClick={() => pick("spouseAtc", "II017")}>
            <b>II017</b>&nbsp;Income from Profession – 8% IT Rate
          </BirCkRow>
        </div>
      </div>

      {/* 70 spouse name */}
      <div className="bir-cell b" style={{ borderTop: 0 }}>
        <span className="bir-ino">70</span>{" "}
        <span className="bir-cap">Spouse&rsquo;s Name (Last Name, First Name, Middle Name)</span>
        <BirText field="spouseName" data={data} set={set} />
      </div>

      {/* 71 contact | 72 citizenship */}
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br grow">
          <span className="lblgrp">
            <span className="bir-ino">71</span> <span className="bir-cap">Contact Number</span>
          </span>
          <div className="fld">
            <BirText field="spouseContact" data={data} set={set} lower />
          </div>
        </div>
        <div className="bir-cell inline grow">
          <span className="lblgrp">
            <span className="bir-ino">72</span> <span className="bir-cap">Citizenship</span>
          </span>
          <div className="fld">
            <BirText field="spouseCitizenship" data={data} set={set} />
          </div>
        </div>
      </div>

      {/* 73 foreign credits | 74 foreign tax number */}
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br grow">
          <span className="lblgrp">
            <span className="bir-ino">73</span> <span className="bir-cap">Claiming Foreign Tax Credits?</span>
          </span>
          <div className="fld" style={{ gap: 14 }}>
            <BirCkRow on={is("spouseForeignCredit", "yes")} onClick={() => pick("spouseForeignCredit", "yes")}>
              Yes
            </BirCkRow>
            <BirCkRow on={is("spouseForeignCredit", "no")} onClick={() => pick("spouseForeignCredit", "no")}>
              No
            </BirCkRow>
          </div>
        </div>
        <div className="bir-cell inline grow">
          <span className="lblgrp">
            <span className="bir-ino">74</span> <span className="bir-cap">Foreign Tax Number</span>{" "}
            <span className="bir-capi">(if applicable)</span>
          </span>
          <div className="fld">
            <BirText field="spouseForeignTaxNo" data={data} set={set} />
          </div>
        </div>
      </div>

      {/* 75 spouse tax rate */}
      <div className="bir-cell inline b" style={{ borderTop: 0, alignItems: "flex-start" }}>
        <span className="lblgrp" style={{ paddingTop: 4 }}>
          <span className="bir-ino">75</span> <span className="bir-cap">Tax Rate</span>
        </span>
        <div className="fld col" style={{ gap: 3, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <BirCkRow on={is("spouseTaxRate", "graduated")} onClick={() => pick("spouseTaxRate", "graduated")}>
            Graduated rates with OSD as method of deduction
          </BirCkRow>
          <BirCkRow on={is("spouseTaxRate", "eight")} onClick={() => pick("spouseTaxRate", "eight")}>
            8% in lieu of Graduated Rates under Sec. 24(A) &amp; Percentage Tax under Sec. 116 of NIRC{" "}
            <i>[available if gross sales/receipts and other non-operating income do not exceed Three million pesos (P3M)]</i>
          </BirCkRow>
        </div>
      </div>

      {/* tax tables */}
      <div className="row" style={{ marginTop: 6, gap: 8 }}>
        <div className="grow">
          <table className="bir-taxtable">
            <thead>
              <tr>
                <th colSpan={2}>TABLE 1 – Tax Rates (effective Jan 1, 2018 to Dec 31, 2022)</th>
              </tr>
              <tr>
                <th>If Taxable Income is:</th>
                <th>Tax Due is:</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Not over P 250,000</td><td>0%</td></tr>
              <tr><td>Over P 250,000 but not over P 400,000</td><td>20% of the excess over P 250,000</td></tr>
              <tr><td>Over P 400,000 but not over P 800,000</td><td>P 30,000 + 25% of the excess over P 400,000</td></tr>
              <tr><td>Over P 800,000 but not over P 2,000,000</td><td>P 130,000 + 30% of the excess over P 800,000</td></tr>
              <tr><td>Over P 2,000,000 but not over P 8,000,000</td><td>P 490,000 + 32% of the excess over P 2,000,000</td></tr>
              <tr><td>Over P 8,000,000</td><td>P 2,410,000 + 35% of the excess over P 8,000,000</td></tr>
            </tbody>
          </table>
        </div>
        <div className="grow">
          <table className="bir-taxtable">
            <thead>
              <tr>
                <th colSpan={2}>TABLE 2 – Tax Rates (effective Jan 1, 2023 and onwards)</th>
              </tr>
              <tr>
                <th>If Taxable Income is:</th>
                <th>Tax Due is:</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Not over P 250,000</td><td>0%</td></tr>
              <tr><td>Over P 250,000 but not over P 400,000</td><td>15% of the excess over P 250,000</td></tr>
              <tr><td>Over P 400,000 but not over P 800,000</td><td>P 22,500 + 20% of the excess over P 400,000</td></tr>
              <tr><td>Over P 800,000 but not over P 2,000,000</td><td>P 102,500 + 25% of the excess over P 800,000</td></tr>
              <tr><td>Over P 2,000,000 but not over P 8,000,000</td><td>P 402,500 + 30% of the excess over P 2,000,000</td></tr>
              <tr><td>Over P 8,000,000</td><td>P 2,202,500 + 35% of the excess over P 8,000,000</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </FormCtx.Provider>
  );
}

export function Form1701A(props: FormProps<Comp1701A>) {
  return (
    <>
      <Form1701A_P1 {...props} />
      <Form1701A_P2 {...props} />
    </>
  );
}

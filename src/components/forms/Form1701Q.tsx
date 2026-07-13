// Form1701Q.tsx — faithful 2-page replica of BIR Form 1701Q (January 2018 ENCS),
// Quarterly Income Tax Return for Individuals, Estates and Trusts. Mirrors the
// official printed layout:
//   Page 1 — Part I Background (items 1-16), Part II Spouse Background (17-25),
//            Part III Total Tax Payable (26-31), Part IV Details of Payment.
//   Page 2 — TIN/name band, Part V Computation of Tax: Schedule I graduated
//            (36-46), Schedule II 8% (47-54), Schedule III credits (55-62),
//            item 63, Schedule IV penalties (64-67), item 68, tax-rate table.
//
// Engine-computed lines are read-only; user-captured background/credit/penalty
// fields are editable inputs. Field keys match the 1701Q compute engine + XML.

import { createContext, useContext, type ReactNode } from "react";
import type { Comp1701Q } from "../../lib/compute";
import type { FormProps } from "../formProps";
import type { FilingData } from "../../types";
import { BirHeader, DeclSign, PartBand, PaymentDetails } from "../formparts";
import { BirAmt, BirBoxes, BirCkRow, BirText, BirVal, type SetFn } from "../formkit";

// Item 7 — Taxpayer/Filer Type.
const FILER_TYPES: Array<[string, string]> = [
  ["single", "Single Proprietor"],
  ["prof", "Professional"],
  ["estate", "Estate"],
  ["trust", "Trust"],
];

// Item 19 — Filer's Spouse Type (no Estate/Trust; Compensation Earner instead).
const SPOUSE_TYPES: Array<[string, string]> = [
  ["single", "Single Proprietor"],
  ["prof", "Professional"],
  ["comp", "Compensation Earner"],
];

// Item 8 / Item 20 — ATC choices (form-grid order; spouse adds II011).
const ATC_CODES: Array<[string, string]> = [
  ["II012", "Business Income – Graduated IT Rates"],
  ["II014", "Income from Profession – Graduated IT Rates"],
  ["II013", "Mixed Income – Graduated IT Rates"],
  ["II015", "Business Income – 8% IT Rate"],
  ["II017", "Income from Profession – 8% IT Rate"],
  ["II016", "Mixed Income – 8% IT Rate"],
];
const SPOUSE_ATC_CODES: Array<[string, string]> = [["II011", "Compensation Income"], ...ATC_CODES];

// ── form-wide context so the row helpers below can live at MODULE scope.
//    Defining them inside the component gave each render a new component type,
//    which remounted every <input> on each keystroke and dropped the cursor. ──
interface Ctx1701Q {
  data: FilingData;
  set: SetFn;
  is: (f: string, v: string) => boolean;
  pick: (f: string, v: string) => void;
}
const FormCtx = createContext<Ctx1701Q | null>(null);
const useF = () => useContext(FormCtx) as Ctx1701Q;

// ── shared computation row: number | label | A amount | B amount ──
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
  no?: ReactNode;
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
      <div className="desc" style={{ fontWeight: strong ? 700 : 400, paddingLeft: indent ? 16 : undefined }}>
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

// ── grey "A) Taxpayer | B) Spouse" column header ──
function ABHead({ label }: { label: string }) {
  return (
    <div className="row b" style={{ borderTop: 0, background: "var(--shade2)", fontWeight: 700, alignItems: "stretch", minHeight: 22 }}>
      <div className="num" style={{ width: 28, flex: "none" }}></div>
      <div className="desc" style={{ flex: 1, fontSize: 10.6, display: "flex", alignItems: "center", padding: "2px 6px" }}>
        {label}
      </div>
      <div className="amtcell bl br bir-amthead" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        A) Taxpayer/Filer
      </div>
      <div className="amtcell br bir-amthead" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        B) Spouse
      </div>
    </div>
  );
}

// ── light schedule sub-band (no amount heads) ──
function SchedBand({ children }: { children: ReactNode }) {
  return (
    <div className="bir-section b" style={{ borderTop: 0 }}>
      {children}
    </div>
  );
}

// ── ATC radio grid ──
function AtcGrid({ field, codes }: { field: string; codes: Array<[string, string]> }) {
  const { is, pick } = useF();
  return (
    <div className="fld atc-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 18px" }}>
      {codes.map(([v, l]) => (
        <BirCkRow key={v} on={is(field, v)} onClick={() => pick(field, v)}>
          <b>{v}</b>&nbsp;{l}
        </BirCkRow>
      ))}
    </div>
  );
}

// ── Tax-rate + method block, reused for taxpayer (16/16A) and spouse (25/25A) ──
function RateBlock({ no, noA, rateField, methodField }: { no: string; noA: string; rateField: string; methodField: string }) {
  const { is, pick, data } = useF();
  return (
    <div className="bir-cell inline b" style={{ borderTop: 0, alignItems: "flex-start" }}>
      <span className="lblgrp" style={{ paddingTop: 4 }}>
        <span className="bir-ino">{no}</span> <span className="bir-cap">Tax Rate</span>
      </span>
      <div className="fld" style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
        <BirCkRow on={is(rateField, "graduated")} onClick={() => pick(rateField, "graduated")}>
          Graduated Rates per Tax Table (page 2)
        </BirCkRow>
        <BirCkRow on={is(rateField, "eight")} onClick={() => pick(rateField, "eight")}>
          8% on gross sales/receipts &amp; other non-operating income in lieu of Graduated Rates under Sec.
          24(A)(2)(a) &amp; Percentage Tax under Sec. 116{" "}
          <i>[available if gross sales/receipts and other non-operating income do not exceed P3M]</i>
        </BirCkRow>
        {data[rateField] !== "eight" && (
          <div className="row" style={{ gap: 16, marginTop: 2 }}>
            <span style={{ fontSize: 9.6, fontWeight: 700 }}>
              <span className="bir-ino">{noA}</span> Method of Deduction:
            </span>
            <BirCkRow on={is(methodField, "itemized")} onClick={() => pick(methodField, "itemized")}>
              Itemized Deduction [Sec. 34(A-J)]
            </BirCkRow>
            <BirCkRow on={is(methodField, "osd")} onClick={() => pick(methodField, "osd")}>
              Optional Standard Deduction (OSD) – 40% of Gross Sales/Receipts [Sec. 34(L)]
            </BirCkRow>
          </div>
        )}
      </div>
    </div>
  );
}

export function Form1701Q({ tp, data, set, comp }: FormProps<Comp1701Q>) {
  const pick = (f: string, v: string) => set(f, data[f] === v ? "" : v);
  const is = (f: string, v: string) => data[f] === v;
  const name = tp
    ? tp.kind === "individual"
      ? [tp.lastName, tp.firstName, tp.middleName].filter(Boolean).join(", ")
      : tp.regName
    : "";

  const A = comp.A;
  const Bb = comp.B;

  return (
    <FormCtx.Provider value={{ data, set, is, pick }}>
      {/* ============================ PAGE 1 ============================ */}
      <div className="bir-sheet">
        <BirHeader
          code="1701Q"
          date="January 2018 (ENCS)"
          page="1"
          title="Quarterly Income Tax Return"
          sub="For Individuals, Estates and Trusts"
          pcode="1701Q 01/18 ENCS P1"
        />
        <div className="bir-instr bb b" style={{ borderTop: 0 }}>
          Enter all required information in CAPITAL LETTERS using BLACK ink. Mark all applicable boxes with an
          &ldquo;X&rdquo;. Two copies must be filed with the BIR and one held by the Tax Filer.
        </div>

        {/* 1 year | 2 quarter | 3 amended | 4 sheets */}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br" style={{ width: 130 }}>
            <span className="lblgrp">
              <span className="bir-ino">1</span> <span className="bir-cap">For the Year</span>
            </span>
            <div className="fld">
              <BirText field="year" data={data} set={set} placeholder="2024" />
            </div>
          </div>
          <div className="bir-cell inline br grow">
            <span className="lblgrp">
              <span className="bir-ino">2</span> <span className="bir-cap">Quarter</span>
            </span>
            <div className="fld" style={{ gap: 14 }}>
              {([["1st", "First"], ["2nd", "Second"], ["3rd", "Third"]] as Array<[string, string]>).map(([v, l]) => (
                <BirCkRow key={v} on={is("quarter", v)} onClick={() => pick("quarter", v)}>
                  {l}
                </BirCkRow>
              ))}
            </div>
          </div>
          <div className="bir-cell inline br" style={{ width: 170 }}>
            <span className="lblgrp">
              <span className="bir-ino">3</span> <span className="bir-cap">Amended Return?</span>
            </span>
            <div className="fld" style={{ gap: 12 }}>
              <BirCkRow on={is("amended", "yes")} onClick={() => pick("amended", "yes")}>Yes</BirCkRow>
              <BirCkRow on={is("amended", "no")} onClick={() => pick("amended", "no")}>No</BirCkRow>
            </div>
          </div>
          <div className="bir-cell inline" style={{ width: 170 }}>
            <span className="lblgrp">
              <span className="bir-ino">4</span> <span className="bir-cap">No. of Sheets Attached</span>
            </span>
            <div className="fld">
              <BirText field="sheets" data={data} set={set} placeholder="0" />
            </div>
          </div>
        </div>

        <PartBand>Part I – Background Information on Taxpayer/Filer</PartBand>
        {/* 5 TIN | 6 RDO */}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell br" style={{ width: 360 }}>
            <span className="bir-ino">5</span> <span className="bir-cap">Taxpayer Identification Number (TIN)</span>
            <div style={{ marginTop: 3 }}>
              <BirBoxes value={(tp && tp.tin) || ""} count={14} groups={[3, 3, 3, 5]} />
            </div>
          </div>
          <div className="bir-cell" style={{ width: 130 }}>
            <span className="bir-ino">6</span> <span className="bir-cap">RDO Code</span>
            <div style={{ marginTop: 3 }}>
              <BirBoxes value={(tp && tp.rdo) || ""} count={3} />
            </div>
          </div>
        </div>
        {/* 7 filer type */}
        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp">
            <span className="bir-ino">7</span> <span className="bir-cap">Taxpayer/Filer Type</span>
          </span>
          <div className="fld" style={{ gap: 14, flexWrap: "wrap" }}>
            {FILER_TYPES.map(([v, l]) => (
              <BirCkRow key={v} on={is("filerType", v)} onClick={() => pick("filerType", v)}>{l}</BirCkRow>
            ))}
          </div>
        </div>
        {/* 8 ATC */}
        <div className="bir-cell inline b" style={{ borderTop: 0, alignItems: "flex-start" }}>
          <span className="lblgrp" style={{ paddingTop: 4 }}>
            <span className="bir-ino">8</span> <span className="bir-cap">Alphanumeric Tax Code (ATC)</span>
          </span>
          <AtcGrid field="atc" codes={ATC_CODES} />
        </div>
        {/* 9 name */}
        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp">
            <span className="bir-ino">9</span> <span className="bir-cap">Taxpayer/Filer&rsquo;s Name (Last Name, First Name, Middle Name)</span>
          </span>
          <div className="fld"><BirVal value={name} /></div>
        </div>
        {/* 10 address | 10A zip */}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br grow">
            <span className="lblgrp">
              <span className="bir-ino">10</span> <span className="bir-cap">Registered Address</span>
            </span>
            <div className="fld"><BirVal value={tp ? [tp.address, tp.city].filter(Boolean).join(", ") : ""} fit /></div>
          </div>
          <div className="bir-cell inline" style={{ flex: "0 0 150px" }}>
            <span className="lblgrp">
              <span className="bir-ino">10A</span> <span className="bir-cap">ZIP Code</span>
            </span>
            <div className="fld"><BirVal value={tp && tp.zip} /></div>
          </div>
        </div>
        {/* 11 DOB | 12 email */}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br" style={{ width: 320 }}>
            <span className="lblgrp">
              <span className="bir-ino">11</span> <span className="bir-cap">Date of Birth (MM/DD/YYYY)</span>
            </span>
            <div className="fld"><BirVal value={tp && tp.birthdate} /></div>
          </div>
          <div className="bir-cell inline grow">
            <span className="lblgrp">
              <span className="bir-ino">12</span> <span className="bir-cap">Email Address</span>
            </span>
            <div className="fld"><BirVal value={tp && tp.email} lower /></div>
          </div>
        </div>
        {/* 13 citizenship | 14 foreign tax no | 15 foreign credits */}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br" style={{ width: 250 }}>
            <span className="lblgrp">
              <span className="bir-ino">13</span> <span className="bir-cap">Citizenship</span>
            </span>
            <div className="fld"><BirVal value={tp && tp.citizenship} /></div>
          </div>
          <div className="bir-cell inline br grow">
            <span className="lblgrp">
              <span className="bir-ino">14</span> <span className="bir-cap">Foreign Tax Number, if applicable</span>
            </span>
            <div className="fld"><BirText field="foreignTaxNo" data={data} set={set} /></div>
          </div>
          <div className="bir-cell inline" style={{ width: 250 }}>
            <span className="lblgrp">
              <span className="bir-ino">15</span> <span className="bir-cap">Claiming Foreign Tax Credits?</span>
            </span>
            <div className="fld" style={{ gap: 12 }}>
              <BirCkRow on={is("foreignCredit", "yes")} onClick={() => pick("foreignCredit", "yes")}>Yes</BirCkRow>
              <BirCkRow on={is("foreignCredit", "no")} onClick={() => pick("foreignCredit", "no")}>No</BirCkRow>
            </div>
          </div>
        </div>
        {/* 16 tax rate + 16A method */}
        <RateBlock no="16" noA="16A" rateField="rateA" methodField="methodA" />

        {/* Part II — Background Information on Spouse */}
        <PartBand>Part II – Background Information on Spouse (if applicable)</PartBand>
        {/* 17 spouse TIN | 18 RDO */}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell br" style={{ width: 360 }}>
            <span className="bir-ino">17</span> <span className="bir-cap">Spouse&rsquo;s TIN</span>
            <div style={{ marginTop: 3 }}>
              <BirBoxes value={(data.spouseTin as string) || ""} count={14} groups={[3, 3, 3, 5]} />
            </div>
          </div>
          <div className="bir-cell" style={{ width: 130 }}>
            <span className="bir-ino">18</span> <span className="bir-cap">RDO Code</span>
            <div style={{ marginTop: 3 }}>
              <BirBoxes value={(data.spouseRdo as string) || ""} count={3} />
            </div>
          </div>
        </div>
        {/* 19 spouse type */}
        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp">
            <span className="bir-ino">19</span> <span className="bir-cap">Filer&rsquo;s Spouse Type</span>
          </span>
          <div className="fld" style={{ gap: 14, flexWrap: "wrap" }}>
            {SPOUSE_TYPES.map(([v, l]) => (
              <BirCkRow key={v} on={is("spouseType", v)} onClick={() => pick("spouseType", v)}>{l}</BirCkRow>
            ))}
          </div>
        </div>
        {/* 20 spouse ATC */}
        <div className="bir-cell inline b" style={{ borderTop: 0, alignItems: "flex-start" }}>
          <span className="lblgrp" style={{ paddingTop: 4 }}>
            <span className="bir-ino">20</span> <span className="bir-cap">Alphanumeric Tax Code (ATC)</span>
          </span>
          <AtcGrid field="spouseAtc" codes={SPOUSE_ATC_CODES} />
        </div>
        {/* 21 spouse name */}
        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp">
            <span className="bir-ino">21</span> <span className="bir-cap">Spouse&rsquo;s Name (Last Name, First Name, Middle Name)</span>
          </span>
          <div className="fld"><BirText field="spouseName" data={data} set={set} /></div>
        </div>
        {/* 22 citizenship | 23 foreign tax no | 24 foreign credits */}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br" style={{ width: 250 }}>
            <span className="lblgrp">
              <span className="bir-ino">22</span> <span className="bir-cap">Citizenship</span>
            </span>
            <div className="fld"><BirText field="spouseCitizenship" data={data} set={set} /></div>
          </div>
          <div className="bir-cell inline br grow">
            <span className="lblgrp">
              <span className="bir-ino">23</span> <span className="bir-cap">Foreign Tax Number, if applicable</span>
            </span>
            <div className="fld"><BirText field="spouseForeignTaxNo" data={data} set={set} /></div>
          </div>
          <div className="bir-cell inline" style={{ width: 250 }}>
            <span className="lblgrp">
              <span className="bir-ino">24</span> <span className="bir-cap">Claiming Foreign Tax Credits?</span>
            </span>
            <div className="fld" style={{ gap: 12 }}>
              <BirCkRow on={is("spouseForeignCredit", "yes")} onClick={() => pick("spouseForeignCredit", "yes")}>Yes</BirCkRow>
              <BirCkRow on={is("spouseForeignCredit", "no")} onClick={() => pick("spouseForeignCredit", "no")}>No</BirCkRow>
            </div>
          </div>
        </div>
        {/* 25 spouse tax rate + 25A method */}
        <RateBlock no="25" noA="25A" rateField="rateB" methodField="methodB" />

        {/* Part III — Total Tax Payable */}
        <PartBand sub="(DO NOT enter Centavos; 49 Centavos or Less drop down; 50 or more round up)">
          Part III – Total Tax Payable
        </PartBand>
        <ABHead label="Particulars" />
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="26" label="Tax Due" sub="(From Part V, Schedule I-Item 46 OR Schedule II-Item 54)" base="taxDue_" roA roB valA={A.taxDue} valB={Bb.taxDue} strong />
          <CRow no="27" label="Less: Tax Credits/Payments" sub="(From Part V, Schedule III-Item 62)" base="credits_" roA roB valA={A.credits} valB={Bb.credits} />
          <CRow no="28" label="Tax Payable/(Overpayment) (Item 26 Less Item 27)" sub="(From Part V, Item 63)" base="payable_" roA roB valA={A.payable} valB={Bb.payable} strong />
          <CRow no="29" label="Add: Total Penalties" sub="(From Part V, Schedule IV-Item 67)" base="pen_" roA roB valA={A.penalties} valB={Bb.penalties} />
          <CRow no="30" label="Total Amount Payable/(Overpayment) (Sum of Items 28 and 29)" sub="(From Part V, Item 68)" base="total_" roA roB valA={A.totalPayable} valB={Bb.totalPayable} strong />
          <div className="bir-line bt" style={{ background: "var(--shade2)" }}>
            <div className="num">31</div>
            <div className="desc" style={{ fontWeight: 700 }}>
              Aggregate Amount Payable/(Overpayment) (Sum of Items 30A &amp; 30B)
            </div>
            <div className="amtcell bl br" style={{ width: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BirAmt ro value={comp.aggregate} />
            </div>
          </div>
        </div>

        <DeclSign name={name} />
        <PaymentDetails data={data} set={set} startNo={32} title="Part IV – Details of Payment" />
      </div>

      {/* ============================ PAGE 2 ============================ */}
      <div className="bir-sheet">
        <BirHeader
          code="1701Q"
          date="January 2018 (ENCS)"
          page="2"
          title="Quarterly Income Tax Return"
          sub="For Individuals, Estates and Trusts"
          pcode="1701Q 01/18 ENCS P2"
        />
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br grow">
            <span className="lblgrp"><span className="bir-cap">TIN</span></span>
            <div className="fld"><BirBoxes value={(tp && tp.tin) || ""} count={14} groups={[3, 3, 3, 5]} /></div>
          </div>
          <div className="bir-cell inline grow">
            <span className="lblgrp"><span className="bir-cap">Taxpayer/Filer&rsquo;s Last Name</span></span>
            <div className="fld"><BirVal value={tp ? (tp.kind === "individual" ? tp.lastName : tp.regName) : ""} /></div>
          </div>
        </div>

        <PartBand sub="(DO NOT enter Centavos; 49 Centavos or Less drop down; 50 or more round up)">
          Part V – Computation of Tax Due
        </PartBand>

        {/* Schedule I — Graduated IT Rate (items 36-46) */}
        <SchedBand>
          Declaration this Quarter — If graduated rate, fill in Items 36 to 46; if 8%, fill in Items 47 to 54.
          <br />
          Schedule I – For Graduated IT Rate
        </SchedBand>
        <ABHead label="Particulars" />
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="36" label="Sales/Revenues/Receipts/Fees (net of sales returns, allowances and discounts)" base="sales" valA={A.sales} valB={Bb.sales} />
          <CRow no="37" label="Less: Cost of Sales/Services (applicable only if availing Itemized Deductions)" base="cogs" valA={A.cogs} valB={Bb.cogs} />
          <CRow no="38" label="Gross Income/(Loss) from Operation (Item 36 Less Item 37)" base="gross_" roA roB valA={A.gross} valB={Bb.gross} strong />
          <CRow no="39" label="Less: Total Allowable Itemized Deductions" base="deduct" roA={A.method === "osd"} roB={Bb.method === "osd"} valA={A.method === "osd" ? 0 : undefined} valB={Bb.method === "osd" ? 0 : undefined} />
          <CRow no="40" label="OR Optional Standard Deduction (OSD) (40% of Item 36)" base="osd_" roA roB valA={A.method === "osd" ? A.deductions : 0} valB={Bb.method === "osd" ? Bb.deductions : 0} />
          <CRow no="41" label="Net Income/(Loss) This Quarter (If Itemized: Item 38 Less 39; If OSD: Item 38 Less 40)" base="netInc_" roA roB valA={A.netIncome} valB={Bb.netIncome} strong />
          <CRow no="42" label="Add: Taxable Income/(Loss) Previous Quarter/s" base="prevTaxable" valA={A.prevTaxable} valB={Bb.prevTaxable} />
          <CRow no="43" label={<BirText field="nonOpDescA" data={data} set={set} placeholder="Non-Operating Income (specify)" />} base="nonOp" valA={A.nonOpInc} valB={Bb.nonOpInc} />
          <CRow no="44" label="Amount Received/Share in Income by a Partner from General Professional Partnership (GPP)" base="gpp" valA={A.gppShare} valB={Bb.gppShare} />
          <CRow no="45" label="Total Taxable Income/(Loss) To Date (Sum of Items 41 to 44)" base="cum_" roA roB valA={A.taxableCum} valB={Bb.taxableCum} strong />
          <CRow no="46" label="TAX DUE (Item 45 x Applicable Tax Rate based on Tax Table below)" sub="(To Part III, Item 26)" base="gradTax_" roA roB valA={A.gradTax} valB={Bb.gradTax} strong />
        </div>

        {/* Schedule II — 8% IT Rate (items 47-54) */}
        <SchedBand>Schedule II – For 8% IT Rate</SchedBand>
        <ABHead label="Particulars" />
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="47" label="Sales/Revenues/Receipts/Fees (net of sales returns, allowances and discounts)" base="sales8_" roA roB valA={A.sales8} valB={Bb.sales8} />
          <CRow no="48" label={<BirText field="nonOp8DescA" data={data} set={set} placeholder="Add: Non-Operating Income (specify)" />} base="nonOp8_" roA roB valA={A.nonOpInc8} valB={Bb.nonOpInc8} />
          <CRow no="49" label="Total Income for the quarter (Sum of Items 47 and 48)" base="income8_" roA roB valA={A.income8} valB={Bb.income8} strong />
          <CRow no="50" label="Add: Total Taxable Income/(Loss) Previous Quarter (Item 51 of previous quarter)" base="prev8" valA={A.prev8} valB={Bb.prev8} />
          <CRow no="51" label="Cumulative Taxable Income/(Loss) as of This Quarter (Sum of Items 49 and 50)" base="cum8_" roA roB valA={A.cum8} valB={Bb.cum8} strong />
          <CRow no="52" label="Less: Allowable reduction from gross sales/receipts and other non-operating income of purely self-employed individuals and/or professionals (P250,000)" base="reduce8_" roA roB valA={A.reduce8} valB={Bb.reduce8} />
          <CRow no="53" label="Taxable Income/(Loss) To Date (Item 51 Less Item 52)" base="taxable8_" roA roB valA={A.taxable8} valB={Bb.taxable8} strong />
          <CRow no="54" label="TAX DUE (Item 53 x 8% Tax Rate)" sub="(To Part III, Item 26)" base="tax8_" roA roB valA={A.tax8} valB={Bb.tax8} strong />
        </div>

        {/* Schedule III — Tax Credits/Payments (items 55-62) */}
        <SchedBand>Schedule III – Tax Credits/Payments</SchedBand>
        <ABHead label="Particulars" />
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="55" label="Prior Year's Excess Credits" base="excess" valA={A.excess} valB={Bb.excess} />
          <CRow no="56" label="Tax Payment/s for the Previous Quarter/s" base="prevPaid" valA={A.prevPaid} valB={Bb.prevPaid} />
          <CRow no="57" label="Creditable Tax Withheld for the Previous Quarter/s" base="cwtPrev" valA={A.cwtPrev} valB={Bb.cwtPrev} />
          <CRow no="58" label="Creditable Tax Withheld per BIR Form No. 2307 for this Quarter" base="cwt" valA={A.cwt} valB={Bb.cwt} />
          <CRow no="59" label="Tax Paid in Return Previously Filed, if this is an Amended Return" base="taxPaidPrev" valA={A.taxPaidPrev} valB={Bb.taxPaidPrev} />
          <CRow no="60" label="Foreign Tax Credits, if applicable" base="foreignCredits" valA={A.foreignCredits} valB={Bb.foreignCredits} />
          <CRow no="61" label={<BirText field="otherCreditsDescA" data={data} set={set} placeholder="Other Tax Credits/Payments (specify)" />} base="otherCredits" valA={A.otherCredits} valB={Bb.otherCredits} />
          <CRow no="62" label="Total Tax Credits/Payments (Sum of Items 55 to 61)" sub="(To Part III, Item 27)" base="credT_" roA roB valA={A.credits} valB={Bb.credits} strong />
        </div>

        {/* Item 63 — Tax Payable/(Overpayment) */}
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="63" label="Tax Payable/(Overpayment) (Item 46 or 54, Less Item 62)" sub="(To Part III, Item 28)" base="pay63_" roA roB valA={A.payable} valB={Bb.payable} strong />
        </div>

        {/* Schedule IV — Penalties (items 64-67) */}
        <SchedBand>Schedule IV – Penalties</SchedBand>
        <ABHead label="Particulars" />
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="64" label="Surcharge" base="surcharge" valA={A.surcharge} valB={Bb.surcharge} />
          <CRow no="65" label="Interest" base="interest" valA={A.interest} valB={Bb.interest} />
          <CRow no="66" label="Compromise" base="compromise" valA={A.compromise} valB={Bb.compromise} />
          <CRow no="67" label="Total Penalties (Sum of Items 64 to 66)" sub="(To Part III, Item 29)" base="penT_" roA roB valA={A.penalties} valB={Bb.penalties} strong />
        </div>

        {/* Item 68 — Total Amount Payable/(Overpayment) */}
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="68" label="Total Amount Payable/(Overpayment) (Sum of Items 63 and 67)" sub="(To Part III, Item 30)" base="total68_" roA roB valA={A.totalPayable} valB={Bb.totalPayable} strong />
        </div>

        {/* Tax-rate tables */}
        <div className="row" style={{ marginTop: 6, gap: 8 }}>
          <div className="grow">
            <table className="bir-taxtable">
              <thead>
                <tr><th colSpan={2}>TABLE 1 – Tax Rates (effective Jan 1, 2018 to Dec 31, 2022)</th></tr>
                <tr><th>If Taxable Income is:</th><th>Tax Due is:</th></tr>
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
                <tr><th colSpan={2}>TABLE 2 – Tax Rates (effective Jan 1, 2023 and onwards)</th></tr>
                <tr><th>If Taxable Income is:</th><th>Tax Due is:</th></tr>
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

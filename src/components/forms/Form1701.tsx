// Form1701.tsx — faithful 4-page replica of BIR Form 1701 (January 2018 ENCS),
// Annual Income Tax Return for Individuals (incl. MIXED Income Earners), Estates
// and Trusts. Mirrors the official printed layout page-for-page:
//   Page 1 — Part I Background, Part II Total Tax Payable, Part III Payment.
//   Page 2 — Part IV Spouse Background, Part V Sched 1/2/3.A computation.
//   Page 3 — Sched 3.B (8%), Sched 4 (itemized), Sched 5, Sched 6 (NOLCO).
//   Page 4 — Sched 6 (cont.), Part VI Summary, Part VII Credits, Part VIII Tax
//            Relief, Part IX Reconciliation, tax-rate tables.
//
// Engine-computed summary lines are read-only; the detailed schedules the
// simplified compute engine does not model are faithful editable inputs for the
// printed form. Field keys for the captured background/spouse data match the
// authentic eBIRForms builder (build1701).

import { createContext, useContext, type ReactNode } from "react";
import type { Comp1701 } from "../../lib/compute";
import type { FormProps } from "../formProps";
import type { FilingData } from "../../types";
import { BirHeader, DeclSign, PartBand, PaymentDetails } from "../formparts";
import { BirAmt, BirBoxes, BirCkRow, BirText, BirVal, type SetFn } from "../formkit";

const TAXPAYER_TYPES: Array<[string, string]> = [
  ["single", "Single Proprietor"],
  ["prof", "Professional"],
  ["estate", "Estate"],
  ["trust", "Trust"],
  ["comp", "Compensation Earner"],
];

const SPOUSE_TYPES: Array<[string, string]> = [
  ["single", "Single Proprietor"],
  ["prof", "Professional"],
  ["comp", "Compensation Earner"],
];

const ATC_CODES: Array<[string, string]> = [
  ["II011", "Compensation Income"],
  ["II012", "Business Income – Graduated IT Rates"],
  ["II013", "Mixed Income – Graduated IT Rates"],
  ["II014", "Income from Profession – Graduated IT Rates"],
  ["II015", "Business Income – 8% IT Rate"],
  ["II016", "Mixed Income – 8% IT Rate"],
  ["II017", "Income from Profession – 8% IT Rate"],
];

// Schedule 4 — ordinary allowable itemized deduction categories (items 1-16).
const SCHED4: string[] = [
  "Amortizations",
  "Bad Debts",
  "Charitable and Other Contributions",
  "Depletion",
  "Depreciation",
  "Entertainment, Amusement and Recreation",
  "Fringe Benefits",
  "Interest",
  "Losses",
  "Pension Trusts",
  "Rental",
  "Research and Development",
  "Salaries, Wages and Allowances",
  "SSS, GSIS, Philhealth, HDMF and Other Contributions",
  "Taxes and Licenses",
  "Transportation and Travel",
];

// ── form-wide context so the row helpers below can live at MODULE scope.
//    Defining them inside the component gave each render a new component type,
//    which remounted every <input> on each keystroke and dropped the cursor. ──
interface Ctx1701 {
  data: FilingData;
  set: SetFn;
  is: (f: string, v: string) => boolean;
  pick: (f: string, v: string) => void;
  tin: string;
  lastName: string;
}
const FormCtx = createContext<Ctx1701 | null>(null);
const useF = () => useContext(FormCtx) as Ctx1701;

// ── shared row: number | label | A amount | B amount ──
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

// ── Schedule 6 detailed NOLCO table (Year + cols A-E) ──
function NolcoTable({ rows, totalNo, totalLabel }: { rows: number[]; totalNo: string; totalLabel: string }) {
  const { data, set } = useF();
  const col = { padding: "3px 4px" } as const;
  return (
    <>
      <div className="row b" style={{ borderTop: 0, background: "var(--shade2)", fontSize: 8.6, fontWeight: 700, textAlign: "center" }}>
        <div style={{ width: 86, ...col }} className="br">Year Incurred</div>
        <div className="grow br" style={col}>A. Amount</div>
        <div className="grow br" style={col}>B. NOLCO Applied Previous Year/s</div>
        <div className="grow br" style={col}>C. NOLCO Expired</div>
        <div className="grow br" style={col}>D. NOLCO Applied Current Year</div>
        <div className="grow" style={col}>E. Net Operating Loss (Unapplied) [E = A − (B+C+D)]</div>
      </div>
      {rows.map((r) => (
        <div className="row b" style={{ borderTop: 0 }} key={"nolco" + r}>
          <div style={{ width: 86, display: "flex", alignItems: "center" }} className="br">
            <span className="num" style={{ width: 18, flex: "none" }}>{r}</span>
            <BirText field={`nolco${r}Year`} data={data} set={set} lower />
          </div>
          <div className="grow br"><BirAmt field={`nolco${r}A`} data={data} set={set} /></div>
          <div className="grow br"><BirAmt field={`nolco${r}B`} data={data} set={set} /></div>
          <div className="grow br"><BirAmt field={`nolco${r}C`} data={data} set={set} /></div>
          <div className="grow br"><BirAmt field={`nolco${r}D`} data={data} set={set} /></div>
          <div className="grow"><BirAmt field={`nolco${r}E`} data={data} set={set} /></div>
        </div>
      ))}
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell grow br" style={{ fontWeight: 700, display: "flex", alignItems: "center" }}>
          <span className="bir-ino">{totalNo}</span>&nbsp;<span className="bir-cap">{totalLabel}</span>
        </div>
        <div style={{ width: 170 }}><BirAmt field={`nolco${totalNo}D`} data={data} set={set} /></div>
      </div>
    </>
  );
}

// ── ATC radio grid (7 codes) ──
function AtcGrid({ field }: { field: string }) {
  const { is, pick } = useF();
  return (
    <div className="fld atc-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 18px" }}>
      {ATC_CODES.map(([v, l]) => (
        <BirCkRow key={v} on={is(field, v)} onClick={() => pick(field, v)}>
          <b>{v}</b>&nbsp;{l}
        </BirCkRow>
      ))}
    </div>
  );
}

// ── TIN + Last Name strip for pages 2-4 ──
function TinNameBand() {
  const { tin, lastName } = useF();
  return (
    <>
      <div className="row b" style={{ borderTop: 0, background: "var(--shade2)" }}>
        <div className="grow br" style={{ padding: "2px 6px" }}>
          <span className="bir-cap" style={{ fontWeight: 700 }}>TIN</span>
        </div>
        <div style={{ width: 360, flex: "none", padding: "2px 6px" }}>
          <span className="bir-cap" style={{ fontWeight: 700 }}>Tax Filer&rsquo;s Last Name</span>
        </div>
      </div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell br grow" style={{ minHeight: 24, display: "flex", alignItems: "center" }}>
          <BirBoxes value={tin} count={14} groups={[3, 3, 3, 5]} />
        </div>
        <div className="bir-cell" style={{ width: 360, flex: "none", minHeight: 24, display: "flex", alignItems: "center" }}>
          <BirVal value={lastName} />
        </div>
      </div>
    </>
  );
}

export function Form1701({ tp, data, set, comp }: FormProps<Comp1701>) {
  const pick = (f: string, v: string) => set(f, data[f] === v ? "" : v);
  const is = (f: string, v: string) => data[f] === v;
  const name = tp
    ? tp.kind === "individual"
      ? [tp.lastName, tp.firstName, tp.middleName].filter(Boolean).join(", ")
      : tp.regName
    : "";
  const lastName = tp ? (tp.kind === "individual" ? tp.lastName : tp.regName) : "";
  const A = comp.A;
  const Bb = comp.B;

  return (
    <FormCtx.Provider value={{ data, set, is, pick, tin: (tp && tp.tin) || "", lastName }}>
      {/* ============================ PAGE 1 ============================ */}
      <div className="bir-sheet bir-1701 bir-1701-p1">
        <BirHeader
          code="1701"
          date="January 2018 (ENCS)"
          page="1"
          title="Annual Income Tax Return"
          sub="Individuals (incl. MIXED Income Earners), Estates and Trusts"
          pcode="1701 01/18 ENCS P1"
        />
        <div className="bir-instr bb b" style={{ borderTop: 0 }}>
          Enter all required information in CAPITAL LETTERS using BLACK ink. Mark applicable boxes with an &ldquo;X&rdquo;.
          Two copies must be filed with the BIR and one held by the Tax Filer.
        </div>

        {/* 1 year | 2 amended | 3 short period */}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br grow">
            <span className="lblgrp">
              <span className="bir-ino">1</span> <span className="bir-cap">For the Year (YYYY)</span>
            </span>
            <div className="fld">
              <BirText field="year" data={data} set={set} placeholder="2024" />
            </div>
          </div>
          <div className="bir-cell inline br" style={{ width: 230 }}>
            <span className="lblgrp">
              <span className="bir-ino">2</span> <span className="bir-cap">Amended Return?</span>
            </span>
            <div className="fld" style={{ gap: 12 }}>
              <BirCkRow on={is("amended", "yes")} onClick={() => pick("amended", "yes")}>Yes</BirCkRow>
              <BirCkRow on={is("amended", "no")} onClick={() => pick("amended", "no")}>No</BirCkRow>
            </div>
          </div>
          <div className="bir-cell inline" style={{ width: 230 }}>
            <span className="lblgrp">
              <span className="bir-ino">3</span> <span className="bir-cap">Short Period Return?</span>
            </span>
            <div className="fld" style={{ gap: 12 }}>
              <BirCkRow on={is("shortPeriod", "yes")} onClick={() => pick("shortPeriod", "yes")}>Yes</BirCkRow>
              <BirCkRow on={is("shortPeriod", "no")} onClick={() => pick("shortPeriod", "no")}>No</BirCkRow>
            </div>
          </div>
        </div>

        <PartBand>Part I – Background Information of Taxpayer/Filer</PartBand>
        {/* 4 TIN | 5 RDO */}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell br" style={{ width: 360 }}>
            <span className="bir-ino">4</span> <span className="bir-cap">Taxpayer Identification Number (TIN)</span>
            <div style={{ marginTop: 3 }}>
              <BirBoxes value={(tp && tp.tin) || ""} count={14} groups={[3, 3, 3, 5]} />
            </div>
          </div>
          <div className="bir-cell" style={{ width: 130 }}>
            <span className="bir-ino">5</span> <span className="bir-cap">RDO Code</span>
            <div style={{ marginTop: 3 }}>
              <BirBoxes value={(tp && tp.rdo) || ""} count={3} />
            </div>
          </div>
        </div>
        {/* 6 taxpayer type */}
        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp">
            <span className="bir-ino">6</span> <span className="bir-cap">Taxpayer Type</span>
          </span>
          <div className="fld" style={{ gap: 14, flexWrap: "wrap" }}>
            {TAXPAYER_TYPES.map(([v, l]) => (
              <BirCkRow key={v} on={is("taxpayerType", v)} onClick={() => pick("taxpayerType", v)}>{l}</BirCkRow>
            ))}
          </div>
        </div>
        {/* 7 ATC */}
        <div className="bir-cell inline b" style={{ borderTop: 0, alignItems: "flex-start" }}>
          <span className="lblgrp" style={{ paddingTop: 4 }}>
            <span className="bir-ino">7</span> <span className="bir-cap">Alphanumeric Tax Code (ATC)</span>
          </span>
          <AtcGrid field="atc" />
        </div>
        {/* 8 name */}
        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp">
            <span className="bir-ino">8</span> <span className="bir-cap">Taxpayer&rsquo;s Name (Last Name, First Name, Middle Name)</span>
          </span>
          <div className="fld"><BirVal value={name} /></div>
        </div>
        {/* 9 address | 9A zip */}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br grow">
            <span className="lblgrp">
              <span className="bir-ino">9</span> <span className="bir-cap">Registered Address</span>
            </span>
            <div className="fld"><BirVal value={tp ? [tp.address, tp.city].filter(Boolean).join(", ") : ""} /></div>
          </div>
          <div className="bir-cell inline" style={{ width: 150 }}>
            <span className="lblgrp">
              <span className="bir-ino">9A</span> <span className="bir-cap">ZIP Code</span>
            </span>
            <div className="fld"><BirVal value={tp && tp.zip} /></div>
          </div>
        </div>
        {/* 10 DOB | 11 email */}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br" style={{ width: 320 }}>
            <span className="lblgrp">
              <span className="bir-ino">10</span> <span className="bir-cap">Date of Birth (MM/DD/YYYY)</span>
            </span>
            <div className="fld"><BirVal value={tp && tp.birthdate} /></div>
          </div>
          <div className="bir-cell inline grow">
            <span className="lblgrp">
              <span className="bir-ino">11</span> <span className="bir-cap">Email Address</span>
            </span>
            <div className="fld"><BirVal value={tp && tp.email} lower /></div>
          </div>
        </div>
        {/* 12 citizenship | 13 foreign credits | 14 foreign tax no */}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br" style={{ width: 250 }}>
            <span className="lblgrp">
              <span className="bir-ino">12</span> <span className="bir-cap">Citizenship</span>
            </span>
            <div className="fld"><BirVal value={tp && tp.citizenship} /></div>
          </div>
          <div className="bir-cell inline br" style={{ width: 300 }}>
            <span className="lblgrp">
              <span className="bir-ino">13</span> <span className="bir-cap">Claiming Foreign Tax Credits?</span>
            </span>
            <div className="fld" style={{ gap: 12 }}>
              <BirCkRow on={is("foreignCredit", "yes")} onClick={() => pick("foreignCredit", "yes")}>Yes</BirCkRow>
              <BirCkRow on={is("foreignCredit", "no")} onClick={() => pick("foreignCredit", "no")}>No</BirCkRow>
            </div>
          </div>
          <div className="bir-cell inline grow">
            <span className="lblgrp">
              <span className="bir-ino">14</span> <span className="bir-cap">Foreign Tax Number, if applicable</span>
            </span>
            <div className="fld"><BirText field="foreignTaxNo" data={data} set={set} /></div>
          </div>
        </div>
        {/* 15 contact | 16 civil status */}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br" style={{ width: 270 }}>
            <span className="lblgrp">
              <span className="bir-ino">15</span> <span className="bir-cap">Contact Number</span>
            </span>
            <div className="fld"><BirVal value={tp && tp.phone} lower /></div>
          </div>
          <div className="bir-cell inline grow">
            <span className="lblgrp">
              <span className="bir-ino">16</span> <span className="bir-cap">Civil Status</span>
            </span>
            <div className="fld" style={{ gap: 12, flexWrap: "wrap" }}>
              <BirCkRow on={is("civil", "single")} onClick={() => pick("civil", "single")}>Single</BirCkRow>
              <BirCkRow on={is("civil", "married")} onClick={() => pick("civil", "married")}>Married</BirCkRow>
              <BirCkRow on={is("civil", "sep")} onClick={() => pick("civil", "sep")}>Legally Separated</BirCkRow>
              <BirCkRow on={is("civil", "widow")} onClick={() => pick("civil", "widow")}>Widow/er</BirCkRow>
            </div>
          </div>
        </div>
        {/* 17 spouse income | 18 filing status */}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br grow">
            <span className="lblgrp">
              <span className="bir-ino">17</span> <span className="bir-cap">If married, spouse has income?</span>
            </span>
            <div className="fld" style={{ gap: 12 }}>
              <BirCkRow on={is("spouseIncome", "yes")} onClick={() => pick("spouseIncome", "yes")}>Yes</BirCkRow>
              <BirCkRow on={is("spouseIncome", "no")} onClick={() => pick("spouseIncome", "no")}>No</BirCkRow>
            </div>
          </div>
          <div className="bir-cell inline" style={{ width: 320 }}>
            <span className="lblgrp">
              <span className="bir-ino">18</span> <span className="bir-cap">Filing Status</span>
            </span>
            <div className="fld" style={{ gap: 16 }}>
              <BirCkRow on={is("filing", "joint")} onClick={() => pick("filing", "joint")}>Joint Filing</BirCkRow>
              <BirCkRow on={is("filing", "separate")} onClick={() => pick("filing", "separate")}>Separate Filing</BirCkRow>
            </div>
          </div>
        </div>
        {/* 19 income exempt | 20 income special */}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br grow">
            <span className="lblgrp">
              <span className="bir-ino">19</span> <span className="bir-cap">Income EXEMPT from Income Tax?</span>
            </span>
            <div className="fld" style={{ gap: 12 }}>
              <BirCkRow on={is("incomeExempt", "yes")} onClick={() => pick("incomeExempt", "yes")}>Yes</BirCkRow>
              <BirCkRow on={is("incomeExempt", "no")} onClick={() => pick("incomeExempt", "no")}>No</BirCkRow>
            </div>
          </div>
          <div className="bir-cell inline grow">
            <span className="lblgrp">
              <span className="bir-ino">20</span> <span className="bir-cap">Income subject to SPECIAL/PREFERENTIAL RATE?</span>
            </span>
            <div className="fld" style={{ gap: 12 }}>
              <BirCkRow on={is("incomeSpecial", "yes")} onClick={() => pick("incomeSpecial", "yes")}>Yes</BirCkRow>
              <BirCkRow on={is("incomeSpecial", "no")} onClick={() => pick("incomeSpecial", "no")}>No</BirCkRow>
            </div>
          </div>
        </div>
        {/* 21 tax rate | 21A method */}
        <div className="bir-cell inline b" style={{ borderTop: 0, alignItems: "flex-start" }}>
          <span className="lblgrp" style={{ paddingTop: 4 }}>
            <span className="bir-ino">21</span> <span className="bir-cap">Tax Rate</span>
          </span>
          <div className="fld" style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
            <BirCkRow on={is("rateA", "graduated")} onClick={() => pick("rateA", "graduated")}>
              Graduated Rates
            </BirCkRow>
            <BirCkRow on={is("rateA", "eight")} onClick={() => pick("rateA", "eight")}>
              8% in lieu of Graduated Rates under Sec. 24(A) &amp; Percentage Tax under Sec. 116 of NIRC{" "}
              <i>[available if gross sales/receipts and other non-operating income do not exceed P3M]</i>
            </BirCkRow>
            <div className="row" style={{ gap: 16, marginTop: 2 }}>
              <span style={{ fontSize: 9.6, fontWeight: 700 }}>
                <span className="bir-ino">21A</span> Method of Deduction:
              </span>
              <BirCkRow on={is("methodA", "itemized")} onClick={() => pick("methodA", "itemized")}>
                Itemized Deduction [Sec. 34(A-J)]
              </BirCkRow>
              <BirCkRow on={is("methodA", "osd")} onClick={() => pick("methodA", "osd")}>
                Optional Standard Deduction (OSD) – 40% [Sec. 34(L)]
              </BirCkRow>
            </div>
          </div>
        </div>

        {/* Part II */}
        <PartBand sub="(DO NOT enter Centavos; 49 Centavos or Less drop down; 50 or more round up)">
          Part II – Total Tax Payable
        </PartBand>
        <ABHead label="Particulars" />
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="22" label="Tax Due" sub="(From Part VI Item 5)" base="taxDue_" roA roB valA={A.taxDue} valB={Bb.taxDue} strong />
          <CRow no="23" label="Less: Total Tax Credits/Payments" sub="(From Part VII Item 10)" base="credits_" roA roB valA={A.credits} valB={Bb.credits} />
          <CRow no="24" label="Tax Payable/(Overpayment) (Item 22 Less 23)" base="payable_" roA roB valA={A.payable} valB={Bb.payable} strong />
          <CRow no="25" label="Less: Portion of Tax Payable Allowed for 2nd Installment (50% or less of Item 22)" base="install" valA={A.installment} valB={Bb.installment} />
          <CRow no="26" label="Amount of Tax Payable/(Overpayment) (Item 24 Less 25)" base="afterInstall_" roA roB valA={A.afterInstall} valB={Bb.afterInstall} />
          <CRow no="27" label="Add: Penalties — Interest" base="interest" indent />
          <CRow no="28" label="Surcharge" base="surcharge" indent />
          <CRow no="29" label="Compromise" base="compromise" indent />
          <CRow no="30" label="Total Penalties (Sum of Items 27 to 29)" base="pen_" roA roB valA={A.penalties} valB={Bb.penalties} />
          <CRow no="31" label="Total Amount Payable/(Overpayment) (Sum of Items 26 and 30)" base="total_" roA roB valA={A.totalPayable} valB={Bb.totalPayable} strong />
          <div className="bir-line bt" style={{ background: "var(--shade2)" }}>
            <div className="num">32</div>
            <div className="desc" style={{ fontWeight: 700 }}>
              Aggregate Amount Payable/(Overpayment) (Sum of Items 31A &amp; 31B)
            </div>
            <div className="amtcell bl br" style={{ width: 376, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BirAmt ro value={comp.aggregate} />
            </div>
          </div>
        </div>
        {/* overpayment options */}
        <div className="bir-cell b" style={{ borderTop: 0 }}>
          <span className="bir-capi">If overpayment, mark one (1) box only. (Once the choice is made, the same is irrevocable)</span>
          <div className="row" style={{ gap: 20, marginTop: 3 }}>
            <BirCkRow on={is("over", "refund")} onClick={() => pick("over", "refund")}>To be refunded</BirCkRow>
            <BirCkRow on={is("over", "tcc")} onClick={() => pick("over", "tcc")}>To be issued a Tax Credit Certificate (TCC)</BirCkRow>
            <BirCkRow on={is("over", "carry")} onClick={() => pick("over", "carry")}>To be carried over as a tax credit for next year/quarter</BirCkRow>
          </div>
        </div>

        <DeclSign name={name} />
        <PaymentDetails data={data} set={set} startNo={34} />
      </div>

      {/* ============================ PAGE 2 ============================ */}
      <div className="bir-sheet bir-1701 bir-1701-p2">
        <BirHeader code="1701" date="January 2018 (ENCS)" page="2" title="Annual Income Tax Return" sub="Individuals (incl. MIXED Income Earners), Estates and Trusts" pcode="1701 01/18 ENCS P2" />
        <TinNameBand />

        {/* Part IV — Background Information of Spouse */}
        <PartBand>Part IV – Background Information of Spouse</PartBand>
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell br" style={{ width: 360 }}>
            <span className="bir-ino">1</span> <span className="bir-cap">Spouse&rsquo;s Taxpayer Identification Number (TIN)</span>
            <div style={{ marginTop: 3 }}>
              <BirBoxes value={(data.spouseTin as string) || ""} count={14} groups={[3, 3, 3, 5]} />
            </div>
          </div>
          <div className="bir-cell" style={{ width: 130 }}>
            <span className="bir-ino">2</span> <span className="bir-cap">RDO Code</span>
            <div style={{ marginTop: 3 }}>
              <BirBoxes value={(data.spouseRdo as string) || ""} count={3} />
            </div>
          </div>
        </div>
        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp">
            <span className="bir-ino">3</span> <span className="bir-cap">Filer&rsquo;s Spouse Type</span>
          </span>
          <div className="fld" style={{ gap: 14, flexWrap: "wrap" }}>
            {SPOUSE_TYPES.map(([v, l]) => (
              <BirCkRow key={v} on={is("spouseType", v)} onClick={() => pick("spouseType", v)}>{l}</BirCkRow>
            ))}
          </div>
        </div>
        <div className="bir-cell inline b" style={{ borderTop: 0, alignItems: "flex-start" }}>
          <span className="lblgrp" style={{ paddingTop: 4 }}>
            <span className="bir-ino">4</span> <span className="bir-cap">Alphanumeric Tax Code (ATC)</span>
          </span>
          <AtcGrid field="spouseAtc" />
        </div>
        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp">
            <span className="bir-ino">5</span> <span className="bir-cap">Spouse&rsquo;s Name (Last Name, First Name, Middle Name)</span>
          </span>
          <div className="fld"><BirText field="spouseName" data={data} set={set} /></div>
        </div>
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br" style={{ width: 320 }}>
            <span className="lblgrp">
              <span className="bir-ino">6</span> <span className="bir-cap">Contact Number</span>
            </span>
            <div className="fld"><BirText field="spouseContact" data={data} set={set} lower /></div>
          </div>
          <div className="bir-cell inline grow">
            <span className="lblgrp">
              <span className="bir-ino">7</span> <span className="bir-cap">Citizenship</span>
            </span>
            <div className="fld"><BirText field="spouseCitizenship" data={data} set={set} /></div>
          </div>
        </div>
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br" style={{ width: 300 }}>
            <span className="lblgrp">
              <span className="bir-ino">8</span> <span className="bir-cap">Claiming Foreign Tax Credits?</span>
            </span>
            <div className="fld" style={{ gap: 12 }}>
              <BirCkRow on={is("spouseForeignCredit", "yes")} onClick={() => pick("spouseForeignCredit", "yes")}>Yes</BirCkRow>
              <BirCkRow on={is("spouseForeignCredit", "no")} onClick={() => pick("spouseForeignCredit", "no")}>No</BirCkRow>
            </div>
          </div>
          <div className="bir-cell inline grow">
            <span className="lblgrp">
              <span className="bir-ino">9</span> <span className="bir-cap">Foreign Tax Number, if applicable</span>
            </span>
            <div className="fld"><BirText field="spouseForeignTaxNo" data={data} set={set} /></div>
          </div>
        </div>
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br grow">
            <span className="lblgrp">
              <span className="bir-ino">10</span> <span className="bir-cap">Income EXEMPT from Income Tax?</span>
            </span>
            <div className="fld" style={{ gap: 12 }}>
              <BirCkRow on={is("spouseIncomeExempt", "yes")} onClick={() => pick("spouseIncomeExempt", "yes")}>Yes</BirCkRow>
              <BirCkRow on={is("spouseIncomeExempt", "no")} onClick={() => pick("spouseIncomeExempt", "no")}>No</BirCkRow>
            </div>
          </div>
          <div className="bir-cell inline grow">
            <span className="lblgrp">
              <span className="bir-ino">11</span> <span className="bir-cap">Income subject to SPECIAL/PREFERENTIAL RATE?</span>
            </span>
            <div className="fld" style={{ gap: 12 }}>
              <BirCkRow on={is("spouseIncomeSpecial", "yes")} onClick={() => pick("spouseIncomeSpecial", "yes")}>Yes</BirCkRow>
              <BirCkRow on={is("spouseIncomeSpecial", "no")} onClick={() => pick("spouseIncomeSpecial", "no")}>No</BirCkRow>
            </div>
          </div>
        </div>
        <div className="bir-cell inline b" style={{ borderTop: 0, alignItems: "flex-start" }}>
          <span className="lblgrp" style={{ paddingTop: 4 }}>
            <span className="bir-ino">12</span> <span className="bir-cap">Tax Rate</span>
          </span>
          <div className="fld" style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
            <BirCkRow on={is("spouseRate", "graduated")} onClick={() => pick("spouseRate", "graduated")}>Graduated Rates</BirCkRow>
            <BirCkRow on={is("spouseRate", "eight")} onClick={() => pick("spouseRate", "eight")}>8% in lieu of Graduated Rates &amp; Percentage Tax</BirCkRow>
            <div className="row" style={{ gap: 16, marginTop: 2 }}>
              <span style={{ fontSize: 9.6, fontWeight: 700 }}>
                <span className="bir-ino">12A</span> Method of Deduction:
              </span>
              <BirCkRow on={is("spouseMethod", "itemized")} onClick={() => pick("spouseMethod", "itemized")}>Itemized</BirCkRow>
              <BirCkRow on={is("spouseMethod", "osd")} onClick={() => pick("spouseMethod", "osd")}>OSD (40%)</BirCkRow>
            </div>
          </div>
        </div>

        {/* Part V — Computation of Tax */}
        <PartBand>Part V – Computation of Tax</PartBand>

        {/* Schedule 1 — Gross Compensation Income & Tax Withheld */}
        <SchedBand>Schedule 1 – Gross Compensation Income and Tax Withheld</SchedBand>
        <div className="row b" style={{ borderTop: 0, background: "var(--shade2)", fontSize: 9.6, fontWeight: 700 }}>
          <div className="num" style={{ width: 28 }}></div>
          <div style={{ width: 96, padding: "3px 5px" }} className="br">For</div>
          <div className="grow br" style={{ padding: "3px 5px" }}>Name of Employer</div>
          <div style={{ width: 160, padding: "3px 5px" }} className="br bl">Employer&rsquo;s TIN</div>
          <div style={{ width: 140, padding: "3px 5px" }} className="br">Compensation Income</div>
          <div style={{ width: 140, padding: "3px 5px", textAlign: "center" }}>Tax Withheld</div>
        </div>
        {[1, 2].map((r) => (
          <div className="row b" style={{ borderTop: 0 }} key={"emp" + r}>
            <div className="num" style={{ width: 28, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{r}</div>
            <div style={{ width: 96, padding: "2px 5px", display: "flex", flexDirection: "column", gap: 2, justifyContent: "center" }} className="br">
              <BirCkRow on={is(`sch1_${r}Who`, "taxpayer")} onClick={() => pick(`sch1_${r}Who`, "taxpayer")}>Taxpayer</BirCkRow>
              <BirCkRow on={is(`sch1_${r}Who`, "spouse")} onClick={() => pick(`sch1_${r}Who`, "spouse")}>Spouse</BirCkRow>
            </div>
            <div className="grow br" style={{ display: "flex", alignItems: "center" }}><BirText field={`sch1_${r}Name`} data={data} set={set} /></div>
            <div style={{ width: 160, display: "flex", alignItems: "center" }} className="br bl"><BirText field={`sch1_${r}TIN`} data={data} set={set} lower /></div>
            <div style={{ width: 140, display: "flex", alignItems: "center" }} className="br"><BirAmt field={`sch1_${r}CI`} data={data} set={set} /></div>
            <div style={{ width: 140, display: "flex", alignItems: "center" }}><BirAmt field={`sch1_${r}TW`} data={data} set={set} /></div>
          </div>
        ))}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="num" style={{ width: 28, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>3A</div>
          <div className="grow br" style={{ fontSize: 10.4, padding: "2px 6px", display: "flex", alignItems: "center", fontWeight: 700 }}>
            Gross Compensation &amp; Total Tax Withheld – TAXPAYER
          </div>
          <div style={{ width: 140 }} className="br bl"><BirAmt ro value={A.comp} /></div>
          <div style={{ width: 140 }}><BirAmt ro value={A.taxWithheldComp} /></div>
        </div>
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="num" style={{ width: 28, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>3B</div>
          <div className="grow br" style={{ fontSize: 10.4, padding: "2px 6px", display: "flex", alignItems: "center", fontWeight: 700 }}>
            Gross Compensation &amp; Total Tax Withheld – SPOUSE
          </div>
          <div style={{ width: 140 }} className="br bl"><BirAmt ro value={Bb.comp} /></div>
          <div style={{ width: 140 }}><BirAmt ro value={Bb.taxWithheldComp} /></div>
        </div>

        {/* Schedule 2 — Taxable Compensation Income */}
        <SchedBand>Schedule 2 – Taxable Compensation Income</SchedBand>
        <ABHead label="Particulars" />
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="4" label="Gross Compensation Income (From Schedule 1 Item 3A/3B)" base="comp4_" roA roB valA={A.comp} valB={Bb.comp} />
          <CRow no="5" label="Less: Non-Taxable / Exempt Compensation" base="nontax" />
          <CRow no="6" label="Taxable Compensation Income (Item 4 Less Item 5)" base="taxcomp_" roA roB valA={A.comp} valB={Bb.comp} strong />
          <CRow no="7" label="Tax Due – Compensation Income (Item 6 x applicable rate)" base="taxcompdue_" />
        </div>

        {/* Schedule 3.A — Graduated */}
        <SchedBand>Schedule 3 – Taxable Business Income · 3.A For Graduated Income Tax Rates</SchedBand>
        <ABHead label="Particulars" />
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="8" label="Sales/Revenues/Receipts/Fees" base="sales" valA={A.sales} valB={Bb.sales} />
          <CRow no="9" label="Less: Sales Returns, Allowances and Discounts" base="returns" valA={A.returns} valB={Bb.returns} />
          <CRow no="10" label="Net Sales/Revenues/Receipts/Fees (Item 8 Less 9)" base="netSales_" roA roB valA={A.netSales} valB={Bb.netSales} strong />
          <CRow no="11" label="Less: Cost of Sales/Services (if Itemized)" base="cogs" valA={A.cogs} valB={Bb.cogs} />
          <CRow no="12" label="Gross Income/(Loss) from Operation (Item 10 Less 11)" base="gross_" roA roB valA={A.gross} valB={Bb.gross} strong />
          <CRow no="13" label="Ordinary Allowable Itemized Deductions (From Schedule 4 Item 18)" base="deduct" roA={A.method === "osd"} roB={Bb.method === "osd"} valA={A.deductions} valB={Bb.deductions} />
          <CRow no="14" label="Special Allowable Itemized Deductions (From Schedule 5)" base="sched14" />
          <CRow no="15" label="Allowance for Net Operating Loss Carry Over (NOLCO)" base="sched15" />
          <CRow no="16" label="Total Allowable Itemized Deductions (Sum of 13 to 15)" base="sched16_" />
          <CRow no="17" label="OR Optional Standard Deduction (OSD) (40% of Item 10)" base="osd_" roA={A.method === "osd"} roB={Bb.method === "osd"} valA={A.method === "osd" ? A.deductions : undefined} valB={Bb.method === "osd" ? Bb.deductions : undefined} />
          <CRow no="18" label="Net Income/(Loss) (Itemized: 12 Less 16; OSD: 10 Less 17)" base="netinc_" roA roB valA={A.netBiz} valB={Bb.netBiz} strong />
          <CRow no="19" label={<BirText field="oni1descA" data={data} set={set} placeholder="Add: Other Non-Operating Income (specify)" />} base="oni1" />
          <CRow no="20" label={<BirText field="oni2descA" data={data} set={set} placeholder="Other Non-Operating Income (specify)" />} base="oni2" />
          <CRow no="21" label="Amount Received/Share in Income by a Partner from GPP" base="gpp" />
          <CRow no="22" label="Total Other Non-Operating Income (Sum of 19 to 21)" base="toni_" roA roB valA={A.otherInc} valB={Bb.otherInc} />
          <CRow no="23" label="Taxable Income – Business (Sum of Items 18 and 22)" base="taxbiz_" roA roB valA={A.netBizTotal} valB={Bb.netBizTotal} strong />
          <CRow no="24" label="Total Taxable Income – Compensation & Business (Sum of 6 and 23)" base="taxtot_" roA roB valA={A.taxableTotal} valB={Bb.taxableTotal} strong />
          <CRow no="25" label="Total Tax Due – Compensation and Business (graduated) (To Part VI Item 1)" base="tdgrad_" roA roB valA={A.rate !== "eight" ? A.taxDue : undefined} valB={Bb.rate !== "eight" ? Bb.taxDue : undefined} strong />
        </div>
      </div>

      {/* ============================ PAGE 3 ============================ */}
      <div className="bir-sheet bir-1701 bir-1701-p3">
        <BirHeader code="1701" date="January 2018 (ENCS)" page="3" title="Annual Income Tax Return" sub="Individuals (incl. MIXED Income Earners), Estates and Trusts" pcode="1701 01/18 ENCS P3" />
        <TinNameBand />

        {/* Schedule 3.B — 8% flat */}
        <SchedBand>Schedule 3 (cont.) · 3.B For 8% Flat Income Tax Rate</SchedBand>
        <ABHead label="Particulars" />
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="26" label="Sales/Revenues/Receipts/Fees (net of returns, allowances, discounts)" base="s8sales_" roA roB valA={A.netSales} valB={Bb.netSales} />
          <CRow no="27" label={<BirText field="s8onidescA" data={data} set={set} placeholder="Add: Other Non-Operating Income (specify)" />} base="s8oni" />
          <CRow no="28" label="Total Income (Sum of Items 26 and 27)" base="s8tot_" roA roB valA={A.gross8} valB={Bb.gross8} strong />
          <CRow no="29" label="Less: Allowable reduction of P250,000 (purely self-employed; not if with compensation)" base="s8red_" roA roB valA={A.rate === "eight" ? A.gross8 - A.taxable8 : undefined} valB={undefined} />
          <CRow no="30" label="Taxable Income/(Loss) (Item 28 Less 29)" base="s8taxable_" roA roB valA={A.taxable8} valB={Bb.taxable8} strong />
          <CRow no="31" label="Tax Due – Business Income (Item 30 x 8%)" base="s8tax_" roA roB valA={A.tax8biz} valB={Bb.tax8biz} />
          <CRow no="32" label="Total Tax Due – Compensation & Business (flat) (Sum of 7 and 31) (To Part VI Item 1)" base="s8total_" roA roB valA={A.rate === "eight" ? A.taxDue : undefined} valB={Bb.rate === "eight" ? Bb.taxDue : undefined} strong />
        </div>

        {/* Schedule 4 — Ordinary Allowable Itemized Deductions */}
        <SchedBand>Schedule 4 – Ordinary Allowable Itemized Deductions</SchedBand>
        <ABHead label="Particulars" />
        <div className="b" style={{ borderTop: 0 }}>
          {SCHED4.map((lbl, i) => (
            <CRow key={"s4_" + (i + 1)} no={String(i + 1)} label={lbl} base={`s4_${i + 1}`} />
          ))}
          <CRow no="17a" label="Others — Janitorial and Messengerial Services" base="s4_17a" indent />
          <CRow no="17b" label="Others — Professional Fees" base="s4_17b" indent />
          <CRow no="17c" label="Others — Security Services" base="s4_17c" indent />
          <CRow no="17d" label={<BirText field="s4_17ddescA" data={data} set={set} placeholder="Others (specify)" />} base="s4_17d" indent />
          <CRow no="18" label="Total Ordinary Allowable Itemized Deductions (Sum of 1 to 17d) (To Schedule 3.A Item 13)" base="deduct" roA={A.method === "osd"} roB={Bb.method === "osd"} valA={A.deductions} valB={Bb.deductions} strong />
        </div>

        {/* Schedule 5 — Special Allowable Itemized Deductions */}
        <SchedBand>Schedule 5 – Special Allowable Itemized Deductions</SchedBand>
        <div className="row b" style={{ borderTop: 0, background: "var(--shade2)", fontSize: 9.6, fontWeight: 700 }}>
          <div className="num" style={{ width: 28 }}></div>
          <div className="grow br" style={{ padding: "3px 5px" }}>Description</div>
          <div style={{ width: 240, padding: "3px 5px" }} className="br bl">Legal Basis</div>
          <div style={{ width: 160, padding: "3px 5px", textAlign: "center" }}>Amount</div>
        </div>
        <div className="bir-section b" style={{ borderTop: 0, fontStyle: "italic" }}>5.A – Taxpayer/Filer</div>
        {["1", "2"].map((n) => (
          <div className="row b" style={{ borderTop: 0 }} key={"s5_" + n}>
            <div className="num" style={{ width: 28, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{n}</div>
            <div className="grow br" style={{ display: "flex", alignItems: "center" }}><BirText field={`s5_${n}desc`} data={data} set={set} /></div>
            <div style={{ width: 240, display: "flex", alignItems: "center" }} className="br bl"><BirText field={`s5_${n}legal`} data={data} set={set} /></div>
            <div style={{ width: 160, display: "flex", alignItems: "center" }}><BirAmt field={`s5_${n}amt`} data={data} set={set} /></div>
          </div>
        ))}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell grow br" style={{ fontWeight: 700 }}>
            <span className="bir-ino">3</span> <span className="bir-cap">Total Special Allowable Itemized Deductions – Taxpayer/Filer (Sum of 1 and 2) (To Schedule 3.A Item 14A)</span>
          </div>
          <div style={{ width: 160 }}><BirAmt field="s5_3amt" data={data} set={set} /></div>
        </div>
        <div className="bir-section b" style={{ borderTop: 0, fontStyle: "italic" }}>5.B – Spouse</div>
        {["4", "5"].map((n) => (
          <div className="row b" style={{ borderTop: 0 }} key={"s5_" + n}>
            <div className="num" style={{ width: 28, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{n}</div>
            <div className="grow br" style={{ display: "flex", alignItems: "center" }}><BirText field={`s5_${n}desc`} data={data} set={set} /></div>
            <div style={{ width: 240, display: "flex", alignItems: "center" }} className="br bl"><BirText field={`s5_${n}legal`} data={data} set={set} /></div>
            <div style={{ width: 160, display: "flex", alignItems: "center" }}><BirAmt field={`s5_${n}amt`} data={data} set={set} /></div>
          </div>
        ))}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell grow br" style={{ fontWeight: 700 }}>
            <span className="bir-ino">6</span> <span className="bir-cap">Total Special Allowable Itemized Deductions – Spouse (Sum of 4 and 5) (To Schedule 3.A Item 14B)</span>
          </div>
          <div style={{ width: 160 }}><BirAmt field="s5_6amt" data={data} set={set} /></div>
        </div>

        {/* Schedule 6 — NOLCO */}
        <SchedBand>Schedule 6 – Computation of Net Operating Loss Carry Over (NOLCO)</SchedBand>
        <ABHead label="6.A – Computation of NOLCO" />
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="1" label="Gross Income" base="nolco1" />
          <CRow no="2" label="Less: Ordinary Allowable Itemized Deductions" base="nolco2" />
          <CRow no="3" label="Net Operating Loss (Item 1 Less Item 2)" base="nolco3_" strong />
        </div>
        <SchedBand>6.A.1 – Taxpayer/Filer&rsquo;s Detailed Computation of Available NOLCO</SchedBand>
        <NolcoTable rows={[4, 5, 6, 7]} totalNo="8" totalLabel="Total NOLCO – Taxpayer/Filer (Sum of Items 4D to 7D) (To Schedule 3.A Item 15A)" />
      </div>

      {/* ============================ PAGE 4 ============================ */}
      <div className="bir-sheet bir-1701 bir-1701-p4">
        <BirHeader code="1701" date="January 2018 (ENCS)" page="4" title="Annual Income Tax Return" sub="Individuals (incl. MIXED Income Earners), Estates and Trusts" pcode="1701 01/18 ENCS P4" />
        <TinNameBand />

        {/* Schedule 6 (cont.) — Spouse NOLCO */}
        <SchedBand>Schedule 6 (cont.) · 6.A.2 – Spouse&rsquo;s Detailed Computation of Available NOLCO</SchedBand>
        <NolcoTable rows={[9, 10, 11, 12]} totalNo="13" totalLabel="Total NOLCO – Spouse (Sum of Items 9D to 12D) (To Schedule 3.A Item 15B)" />

        {/* Part VI — Summary of Income Tax Due */}
        <PartBand>Part VI – Summary of Income Tax Due</PartBand>
        <ABHead label="Particulars" />
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="1" label="Regular Rate – Income Tax Due (From Part V, Item 25 or 32)" base="vi1_" roA roB valA={A.taxDue} valB={Bb.taxDue} />
          <CRow no="2" label="Special Rate – Income Tax Due (From Part X)" base="vi2" />
          <CRow no="3" label="Less: Share of Other Government Agency (if remitted directly)" base="vi3" />
          <CRow no="4" label="Net Special Rate – Income Tax Due/Share of National Govt. (Item 2 Less 3)" base="vi4_" />
          <CRow no="5" label="Total Income Tax Due (Sum of Items 1 & 4) (To Part II Item 22)" base="vi5_" roA roB valA={A.taxDue} valB={Bb.taxDue} strong />
        </div>

        {/* Part VII — Tax Credits/Payments */}
        <PartBand>Part VII – Tax Credits/Payments (attach proof)</PartBand>
        <ABHead label="Particulars" />
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="1" label="Prior Year&rsquo;s Excess Credits" base="excess" valA={A.excess} valB={Bb.excess} />
          <CRow no="2" label="Tax Payments for the First Three (3) Quarters" base="prevPaid" valA={A.prevPaid} valB={Bb.prevPaid} />
          <CRow no="3" label="Creditable Tax Withheld for the First Three (3) Quarters" base="cwt3" />
          <CRow no="4" label="Creditable Tax Withheld per BIR Form 2307 for the 4th Quarter" base="cwt" valA={A.cwt} valB={Bb.cwt} />
          <CRow no="5" label="Creditable Tax Withheld per BIR Form 2316 (From Schedule 1 Item 3A/3B)" base="compCwt" valA={A.taxWithheldComp} valB={Bb.taxWithheldComp} />
          <CRow no="6" label="Tax Paid in Return Previously Filed (if Amended Return)" base="vii6" />
          <CRow no="7" label="Foreign Tax Credits, if applicable" base="vii7" />
          <CRow no="8" label="Special Tax Credits (To Part VIII Item 6)" base="vii8" />
          <CRow no="9" label={<BirText field="vii9descA" data={data} set={set} placeholder="Other Tax Credits/Payments (specify)" />} base="vii9" />
          <CRow no="10" label="Total Tax Credits/Payments (Sum of Items 1 to 9) (To Part II Item 23)" base="credtot_" roA roB valA={A.credits} valB={Bb.credits} strong />
        </div>

        {/* Part VIII — Tax Relief Availment */}
        <PartBand>Part VIII – Tax Relief Availment</PartBand>
        <ABHead label="VIII.A – Special / VIII.B – Exempt" />
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="1" label="Regular Income Tax Otherwise Due (Special)" base="viii1" />
          <CRow no="2" label="Tax Relief on Special Allowable Itemized Deductions" base="viii2" />
          <CRow no="3" label="Sub-Total – Tax Relief (Sum of 1 and 2)" base="viii3_" />
          <CRow no="4" label="Less: Income Tax Due (From Part X)" base="viii4" />
          <CRow no="5" label="Tax Relief Availment Before Special Tax Credit (Item 3 Less 4)" base="viii5_" />
          <CRow no="6" label="Add: Special Tax Credit, if any (From Part VII Item 8)" base="viii6" />
          <CRow no="7" label="Total Tax Relief Availment – SPECIAL (Sum of 5 and 6)" base="viii7_" strong />
          <CRow no="8" label="Regular Income Tax Otherwise Due (Exempt)" base="viii8" />
          <CRow no="9" label="Tax Relief on Special Allowable Itemized Deductions (Exempt)" base="viii9" />
          <CRow no="10" label="Total Tax Relief Availment – EXEMPT (Sum of 8 and 9)" base="viii10_" strong />
        </div>

        {/* Part IX — Reconciliation of Net Income per Books */}
        <PartBand>Part IX – Reconciliation of Net Income per Books Against Taxable Income</PartBand>
        <ABHead label="Particulars" />
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="1" label="Net Income/(Loss) per Books" base="ix1" />
          <CRow no="2" label={<BirText field="ix2descA" data={data} set={set} placeholder="Add: Non-Deductible Expenses/Taxable Other Income (specify)" />} base="ix2" />
          <CRow no="3" label={<BirText field="ix3descA" data={data} set={set} placeholder="Add: Non-Deductible Expenses/Taxable Other Income (specify)" />} base="ix3" />
          <CRow no="4" label={<BirText field="ix4descA" data={data} set={set} placeholder="(specify)" />} base="ix4" />
          <CRow no="5" label="Total (Sum of Items 1 to 4)" base="ix5_" />
          <CRow no="6" label={<BirText field="ix6descA" data={data} set={set} placeholder="Less: Non-Taxable Income / Income Subjected to Final Tax (specify)" />} base="ix6" />
          <CRow no="7" label={<BirText field="ix7descA" data={data} set={set} placeholder="(specify)" />} base="ix7" />
          <CRow no="8" label={<BirText field="ix8descA" data={data} set={set} placeholder="Less: Special/Other Allowable Deductions (specify)" />} base="ix8" />
          <CRow no="9" label={<BirText field="ix9descA" data={data} set={set} placeholder="(specify)" />} base="ix9" />
          <CRow no="10" label="Total (Sum of Items 6 to 9)" base="ix10_" />
          <CRow no="11" label="Net Taxable Income/(Loss) (Item 5 Less Item 10)" base="ix11_" strong />
        </div>

        {/* tax-rate tables */}
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

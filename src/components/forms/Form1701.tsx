// Form1701.tsx — faithful 1701 replica (Annual Income Tax Return,
// Individuals incl. MIXED Income Earners, Estates and Trusts).
// Ported from form-1701.jsx.

import type { ReactNode } from "react";
import type { Comp1701 } from "../../lib/compute";
import type { FormProps } from "../formProps";
import { BirHeader, DeclSign, PartBand, PaymentDetails } from "../formparts";
import { BirAmt, BirBoxes, BirCkRow, BirText, BirVal } from "../formkit";

export function Form1701({ tp, data, set, comp }: FormProps<Comp1701>) {
  const pick = (f: string, v: string) => set(f, data[f] === v ? "" : v);
  const is = (f: string, v: string) => data[f] === v;
  const name = tp
    ? tp.kind === "individual"
      ? [tp.lastName, tp.firstName, tp.middleName].filter(Boolean).join(", ")
      : tp.regName
    : "";

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
  }) {
    return (
      <div className="bir-line bt">
        <div className="num">{no}</div>
        <div className="desc" style={{ fontWeight: strong ? 700 : 400 }}>
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
  const A = comp.A;
  const Bb = comp.B;

  return (
    <>
      {/* PAGE 1 */}
      <div className="bir-sheet">
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
            <div className="fld" style={{ gap: 12 }}>
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
              <span className="bir-ino">4</span> <span className="bir-cap">Short Period?</span>
            </span>
            <div className="fld" style={{ gap: 12 }}>
              <BirCkRow on={is("shortPeriod", "yes")} onClick={() => pick("shortPeriod", "yes")}>
                Yes
              </BirCkRow>
              <BirCkRow on={is("shortPeriod", "no")} onClick={() => pick("shortPeriod", "no")}>
                No
              </BirCkRow>
            </div>
          </div>
        </div>

        <PartBand>Part I – Background Information on Taxpayer/Filer</PartBand>
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
            <span className="bir-ino">8</span> <span className="bir-cap">Taxpayer Type</span>
          </span>
          <div className="fld" style={{ gap: 14 }}>
            {(
              [
                ["single", "Single Proprietor"],
                ["prof", "Professional"],
                ["estate", "Estate"],
                ["trust", "Trust"],
                ["comp", "Compensation Earner"],
              ] as Array<[string, string]>
            ).map(([v, l]) => (
              <BirCkRow key={v} on={is("taxpayerType", v)} onClick={() => pick("taxpayerType", v)}>
                {l}
              </BirCkRow>
            ))}
          </div>
        </div>
        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp">
            <span className="bir-ino">9</span> <span className="bir-cap">Taxpayer&rsquo;s Name</span>
          </span>
          <div className="fld">
            <BirVal value={name} />
          </div>
        </div>
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br grow">
            <span className="lblgrp">
              <span className="bir-ino">11</span> <span className="bir-cap">Registered Address</span>
            </span>
            <div className="fld">
              <BirVal value={tp ? [tp.address, tp.city].filter(Boolean).join(", ") : ""} />
            </div>
          </div>
          <div className="bir-cell inline" style={{ width: 150 }}>
            <span className="lblgrp">
              <span className="bir-ino">11A</span> <span className="bir-cap">ZIP</span>
            </span>
            <div className="fld">
              <BirVal value={tp && tp.zip} />
            </div>
          </div>
        </div>
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br" style={{ width: 320 }}>
            <span className="lblgrp">
              <span className="bir-ino">14</span> <span className="bir-cap">Citizenship</span>
            </span>
            <div className="fld">
              <BirVal value={tp && tp.citizenship} />
            </div>
          </div>
          <div className="bir-cell inline grow">
            <span className="lblgrp">
              <span className="bir-ino">16</span> <span className="bir-cap">Email</span>
            </span>
            <div className="fld">
              <BirVal value={tp && tp.email} lower />
            </div>
          </div>
        </div>

        {/* tax rate + method */}
        <div className="bir-cell inline b" style={{ borderTop: 0, alignItems: "flex-start" }}>
          <span className="lblgrp" style={{ paddingTop: 4 }}>
            <span className="bir-ino">19</span> <span className="bir-cap">Tax Rate &amp; Method</span>
          </span>
          <div className="fld" style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
            <div className="row" style={{ gap: 16 }}>
              <BirCkRow on={is("rateA", "graduated")} onClick={() => pick("rateA", "graduated")}>
                Graduated rates
              </BirCkRow>
              <BirCkRow on={is("rateA", "eight")} onClick={() => pick("rateA", "eight")}>
                8% on business gross sales/receipts (≤₱3M)
              </BirCkRow>
            </div>
            {data.rateA !== "eight" && (
              <div className="row" style={{ gap: 16 }}>
                <span style={{ fontSize: 9.5, fontWeight: 700 }}>Method:</span>
                <BirCkRow on={is("methodA", "itemized")} onClick={() => pick("methodA", "itemized")}>
                  Itemized Deduction
                </BirCkRow>
                <BirCkRow on={is("methodA", "osd")} onClick={() => pick("methodA", "osd")}>
                  OSD (40%)
                </BirCkRow>
              </div>
            )}
          </div>
        </div>

        {/* Part II total tax payable */}
        <PartBand sub="(DO NOT enter Centavos)">Part II – Total Tax Payable</PartBand>
        <div
          className="row b"
          style={{ borderTop: 0, background: "var(--shade2)", fontWeight: 700, alignItems: "center", minHeight: 24 }}
        >
          <div className="num" style={{ width: 28 }}></div>
          <div className="desc" style={{ flex: 1, fontSize: 11 }}>
            Particulars
          </div>
          <div className="amtcell bl br bir-amthead">A) Taxpayer/Filer</div>
          <div className="amtcell br bir-amthead">B) Spouse</div>
        </div>
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="20" label="Tax Due" sub="(From Part VI)" base="taxDue_" roA roB valA={A.taxDue} valB={Bb.taxDue} strong />
          <CRow no="21" label="Less: Total Tax Credits/Payments" base="credits_" roA roB valA={A.credits} valB={Bb.credits} />
          <CRow no="22" label="Net Tax Payable/(Overpayment) (Item 20 Less 21)" base="payable_" roA roB valA={A.payable} valB={Bb.payable} strong />
          <CRow no="23" label="Less: Portion allowed for 2nd Installment" base="install" valA={A.installment} valB={Bb.installment} />
          <CRow no="24" label="Amount Payable/(Overpayment) (Item 22 Less 23)" base="afterInstall_" roA roB valA={A.afterInstall} valB={Bb.afterInstall} />
          <CRow no="28" label="Add: Total Penalties" base="pen" valA={A.penalties} valB={Bb.penalties} />
          <CRow no="29" label="Total Amount Payable/(Overpayment)" base="total_" roA roB valA={A.totalPayable} valB={Bb.totalPayable} strong />
          <div className="bir-line bt" style={{ background: "var(--shade2)" }}>
            <div className="num">30</div>
            <div className="desc" style={{ fontWeight: 700 }}>
              Aggregate Amount Payable/(Overpayment) (Sum of 29A &amp; 29B)
            </div>
            <div className="amtcell bl br" style={{ width: 300 }}>
              <BirAmt ro value={comp.aggregate} />
            </div>
          </div>
        </div>

        <DeclSign name={name} />
        <PaymentDetails data={data} set={set} startNo={32} />
      </div>

      {/* PAGE 2 — Part VI computation */}
      <div className="bir-sheet">
        <BirHeader
          code="1701"
          date="January 2018 (ENCS)"
          page="2"
          title="Annual Income Tax Return"
          sub="Individuals (incl. MIXED Income Earners), Estates and Trusts"
          pcode="1701 01/18 ENCS P2"
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

        <PartBand>Part VI – Computation of Tax</PartBand>
        <div
          className="row b"
          style={{ borderTop: 0, background: "var(--shade)", fontWeight: 700, alignItems: "center", minHeight: 24 }}
        >
          <div className="grow" style={{ fontSize: 10.6, padding: "2px 8px" }}>
            Section A – Compensation Income
          </div>
          <div className="amtcell bl br bir-amthead">A) Taxpayer/Filer</div>
          <div className="amtcell br bir-amthead">B) Spouse</div>
        </div>
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="" label="Taxable Compensation Income (from BIR Form 2316)" base="comp" valA={A.comp} valB={Bb.comp} strong />
        </div>

        <div
          className="row b"
          style={{ borderTop: 0, background: "var(--shade)", fontWeight: 700, alignItems: "center", minHeight: 24 }}
        >
          <div className="grow" style={{ fontSize: 10.6, padding: "2px 8px" }}>
            Section B – Business/Profession Income (Graduated: Itemized or OSD)
          </div>
          <div className="amtcell bl br"></div>
          <div className="amtcell br"></div>
        </div>
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="" label="Sales/Revenues/Receipts/Fees" base="sales" valA={A.sales} valB={Bb.sales} />
          <CRow no="" label="Less: Sales Returns, Allowances &amp; Discounts" base="returns" valA={A.returns} valB={Bb.returns} />
          <CRow no="" label="Net Sales/Receipts" base="netSales_" roA roB valA={A.netSales} valB={Bb.netSales} />
          <CRow no="" label="Less: Cost of Sales/Services" base="cogs" valA={A.cogs} valB={Bb.cogs} />
          <CRow no="" label="Gross Income from Operation" base="gross_" roA roB valA={A.gross} valB={Bb.gross} />
          <CRow
            no=""
            label="Less: Allowable Deductions (Itemized entry or OSD auto-40%)"
            base="deduct"
            roA={A.method === "osd"}
            roB={Bb.method === "osd"}
            valA={A.deductions}
            valB={Bb.deductions}
          />
          <CRow no="" label="Add: Other Taxable / Non-Operating Income" base="other" valA={A.otherInc} valB={Bb.otherInc} />
          <CRow no="" label="Net Income from Business/Profession" base="netBizTotal_" roA roB valA={A.netBizTotal} valB={Bb.netBizTotal} strong />
        </div>

        <div className="bir-section b" style={{ borderTop: 0 }}>
          Section C – Tax Due
        </div>
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="" label="Total Taxable Income (Compensation + Business)" base="taxableTotal_" roA roB valA={A.taxableTotal} valB={Bb.taxableTotal} strong />
          <CRow no="" label="TAX DUE" base="taxDueC_" roA roB valA={A.taxDue} valB={Bb.taxDue} strong />
        </div>

        <div className="bir-section b" style={{ borderTop: 0 }}>
          Section D – Tax Credits/Payments
        </div>
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="" label="Prior Year&rsquo;s Excess Credits" base="excess" valA={A.excess} valB={Bb.excess} />
          <CRow no="" label="Tax Payments for the First Three Quarters" base="prevPaid" valA={A.prevPaid} valB={Bb.prevPaid} />
          <CRow no="" label="Creditable Tax Withheld per BIR Form 2307" base="cwt" valA={A.cwt} valB={Bb.cwt} />
          <CRow no="" label="Tax Withheld on Compensation per BIR Form 2316" base="compCwt" valA={A.taxWithheldComp} valB={Bb.taxWithheldComp} />
          <CRow no="" label="Total Tax Credits/Payments (To Part II Item 21)" base="credT_" roA roB valA={A.credits} valB={Bb.credits} strong />
        </div>

        <div style={{ marginTop: 6 }}>
          <table className="bir-taxtable">
            <thead>
              <tr>
                <th>If Taxable Income is</th>
                <th>Tax Due (2023 onward)</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Not over ₱250,000</td><td>0%</td></tr>
              <tr><td>₱250,000 – ₱400,000</td><td>15% of excess over ₱250,000</td></tr>
              <tr><td>₱400,000 – ₱800,000</td><td>₱22,500 + 20% of excess over ₱400,000</td></tr>
              <tr><td>₱800,000 – ₱2,000,000</td><td>₱102,500 + 25% of excess over ₱800,000</td></tr>
              <tr><td>₱2,000,000 – ₱8,000,000</td><td>₱402,500 + 30% of excess over ₱2,000,000</td></tr>
              <tr><td>Over ₱8,000,000</td><td>₱2,202,500 + 35% of excess over ₱8,000,000</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

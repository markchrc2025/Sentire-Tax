// Form1701Q.tsx — faithful 1701Q replica (pages 1 & 2).
// Quarterly Income Tax Return (Individuals, Estates & Trusts).
// Ported from form-1701Q.jsx.

import type { ReactNode } from "react";
import type { Comp1701Q } from "../../lib/compute";
import type { FormProps } from "../formProps";
import { BirHeader, DeclSign, PartBand, PaymentDetails } from "../formparts";
import { BirAmt, BirBoxes, BirCkRow, BirText, BirVal } from "../formkit";

export function Form1701Q({ tp, data, set, comp }: FormProps<Comp1701Q>) {
  const pick = (f: string, v: string) => set(f, data[f] === v ? "" : v);
  const is = (f: string, v: string) => data[f] === v;
  const name = tp
    ? tp.kind === "individual"
      ? [tp.lastName, tp.firstName, tp.middleName].filter(Boolean).join(", ")
      : tp.regName
    : "";

  // computation line A/B
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
          code="1701Q"
          date="January 2018 (ENCS)"
          page="1"
          title="Quarterly Income Tax Return"
          sub="For Individuals, Estates and Trusts"
          pcode="1701Q 01/18 ENCS P1"
        />
        <div className="bir-instr bb b" style={{ borderTop: 0 }}>
          Enter all required information in CAPITAL LETTERS using BLACK ink. Mark applicable boxes with an &ldquo;X&rdquo;.
          Two copies must be filed with the BIR and one held by the Tax Filer.
        </div>

        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br" style={{ width: 230 }}>
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
              {["1st", "2nd", "3rd"].map((q) => (
                <BirCkRow key={q} on={is("quarter", q)} onClick={() => pick("quarter", q)}>
                  {q}
                </BirCkRow>
              ))}
            </div>
          </div>
          <div className="bir-cell inline" style={{ width: 220 }}>
            <span className="lblgrp">
              <span className="bir-ino">3</span> <span className="bir-cap">Amended?</span>
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
        </div>

        <PartBand>Part I – Background Information on Taxpayer/Filer</PartBand>
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell br" style={{ width: 360 }}>
            <span className="bir-ino">5</span> <span className="bir-cap">TIN</span>
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
        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp">
            <span className="bir-ino">7</span> <span className="bir-cap">Taxpayer/Filer Type</span>
          </span>
          <div className="fld" style={{ gap: 14 }}>
            {(
              [
                ["single", "Single Proprietor"],
                ["prof", "Professional"],
                ["estate", "Estate"],
                ["trust", "Trust"],
              ] as Array<[string, string]>
            ).map(([v, l]) => (
              <BirCkRow key={v} on={is("filerType", v)} onClick={() => pick("filerType", v)}>
                {l}
              </BirCkRow>
            ))}
          </div>
        </div>
        <div className="bir-cell inline b" style={{ borderTop: 0, alignItems: "flex-start" }}>
          <span className="lblgrp" style={{ paddingTop: 4 }}>
            <span className="bir-ino">8</span> <span className="bir-cap">ATC</span>
          </span>
          <div className="fld atc-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px 14px" }}>
            <BirCkRow on={is("atc", "II012")} onClick={() => pick("atc", "II012")}>
              <b>II012</b>&nbsp;Business-Graduated
            </BirCkRow>
            <BirCkRow on={is("atc", "II014")} onClick={() => pick("atc", "II014")}>
              <b>II014</b>&nbsp;Profession-Graduated
            </BirCkRow>
            <BirCkRow on={is("atc", "II013")} onClick={() => pick("atc", "II013")}>
              <b>II013</b>&nbsp;Mixed-Graduated
            </BirCkRow>
            <BirCkRow on={is("atc", "II015")} onClick={() => pick("atc", "II015")}>
              <b>II015</b>&nbsp;Business-8%
            </BirCkRow>
            <BirCkRow on={is("atc", "II017")} onClick={() => pick("atc", "II017")}>
              <b>II017</b>&nbsp;Profession-8%
            </BirCkRow>
            <BirCkRow on={is("atc", "II016")} onClick={() => pick("atc", "II016")}>
              <b>II016</b>&nbsp;Mixed-8%
            </BirCkRow>
          </div>
        </div>
        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp">
            <span className="bir-ino">9</span> <span className="bir-cap">Taxpayer/Filer&rsquo;s Name</span>
          </span>
          <div className="fld">
            <BirVal value={name} />
          </div>
        </div>
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br grow">
            <span className="lblgrp">
              <span className="bir-ino">10</span> <span className="bir-cap">Registered Address</span>
            </span>
            <div className="fld">
              <BirVal value={tp ? [tp.address, tp.city].filter(Boolean).join(", ") : ""} />
            </div>
          </div>
          <div className="bir-cell inline" style={{ width: 150 }}>
            <span className="lblgrp">
              <span className="bir-ino">10A</span> <span className="bir-cap">ZIP</span>
            </span>
            <div className="fld">
              <BirVal value={tp && tp.zip} />
            </div>
          </div>
        </div>

        {/* 16 tax rate + method */}
        <div className="bir-cell inline b" style={{ borderTop: 0, alignItems: "flex-start" }}>
          <span className="lblgrp" style={{ paddingTop: 4 }}>
            <span className="bir-ino">16</span> <span className="bir-cap">Tax Rate &amp; Method</span>
          </span>
          <div className="fld col" style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
            <div className="row" style={{ gap: 16 }}>
              <BirCkRow on={is("rateA", "graduated")} onClick={() => pick("rateA", "graduated")}>
                Graduated rates per Tax Table
              </BirCkRow>
              <BirCkRow on={is("rateA", "eight")} onClick={() => pick("rateA", "eight")}>
                8% on gross sales/receipts
              </BirCkRow>
            </div>
            {data.rateA !== "eight" && (
              <div className="row" style={{ gap: 16 }}>
                <span style={{ fontSize: 9.5, fontWeight: 700 }}>Method:</span>
                <BirCkRow on={is("methodA", "itemized")} onClick={() => pick("methodA", "itemized")}>
                  Itemized Deduction
                </BirCkRow>
                <BirCkRow on={is("methodA", "osd")} onClick={() => pick("methodA", "osd")}>
                  Optional Standard Deduction (40%)
                </BirCkRow>
              </div>
            )}
          </div>
        </div>

        {/* Part III total tax payable */}
        <PartBand>Part III – Total Tax Payable</PartBand>
        <div className="row b" style={{ borderTop: 0, background: "var(--shade2)", fontWeight: 700, alignItems: "center", minHeight: 24 }}>
          <div className="num" style={{ width: 28 }}></div>
          <div className="desc" style={{ flex: 1, fontSize: 11 }}>
            Particulars
          </div>
          <div className="amtcell bl br bir-amthead">A) Taxpayer/Filer</div>
          <div className="amtcell br bir-amthead">B) Spouse</div>
        </div>
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="26" label="Tax Due" sub="(From Part V, Sch. I-46 OR Sch. II-54)" base="taxDue_" roA roB valA={A.taxDue} valB={Bb.taxDue} strong />
          <CRow no="27" label="Less: Tax Credits/Payments" sub="(From Sch. III-62)" base="credits_" roA roB valA={A.credits} valB={Bb.credits} />
          <CRow no="28" label="Tax Payable/(Overpayment) (Item 26 Less 27)" base="payable_" roA roB valA={A.payable} valB={Bb.payable} strong />
          <CRow no="29" label="Add: Total Penalties" base="pen" valA={A.penalties} valB={Bb.penalties} />
          <CRow no="30" label="Total Amount Payable/(Overpayment) (Sum 28 & 29)" base="total_" roA roB valA={A.totalPayable} valB={Bb.totalPayable} strong />
          <div className="bir-line bt" style={{ background: "var(--shade2)" }}>
            <div className="num">31</div>
            <div className="desc" style={{ fontWeight: 700 }}>
              Aggregate Amount Payable/(Overpayment) (Sum of 30A &amp; 30B)
            </div>
            <div className="amtcell bl br" style={{ width: 300 }}>
              <BirAmt ro value={comp.aggregate} />
            </div>
          </div>
        </div>

        <DeclSign name={name} />
        <PaymentDetails data={data} set={set} startNo={32} title="Part IV – Details of Payment" />
      </div>

      {/* PAGE 2 — Part V computation */}
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

        <PartBand>Part V – Computation of Tax</PartBand>
        <div className="row b" style={{ borderTop: 0, background: "var(--shade)", fontWeight: 700, alignItems: "center", minHeight: 24 }}>
          <div className="grow" style={{ fontSize: 10.6, padding: "2px 8px" }}>
            Schedule I – Graduated IT Rates (with Itemized or OSD)
          </div>
          <div className="amtcell bl br bir-amthead">A) Taxpayer/Filer</div>
          <div className="amtcell br bir-amthead">B) Spouse</div>
        </div>
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="32" label="Sales/Revenues/Receipts/Fees" base="sales" valA={A.sales} valB={Bb.sales} />
          <CRow no="33" label="Less: Sales Returns, Allowances & Discounts" base="returns" valA={A.returns} valB={Bb.returns} />
          <CRow no="34" label="Net Sales/Receipts" base="netSales_" roA roB valA={A.netSales} valB={Bb.netSales} />
          <CRow no="35" label="Less: Cost of Sales/Services" base="cogs" valA={A.cogs} valB={Bb.cogs} />
          <CRow no="36" label="Gross Income from Operation" base="gross_" roA roB valA={A.gross} valB={Bb.gross} />
          <CRow
            no="38"
            label="Less: Allowable Deductions (Itemized entry or OSD auto-40%)"
            base="deduct"
            roA={A.method === "osd"}
            roB={Bb.method === "osd"}
            valA={A.deductions}
            valB={Bb.deductions}
          />
          <CRow no="40" label="Net Income (this quarter)" base="netInc_" roA roB valA={A.netIncome} valB={Bb.netIncome} />
          <CRow no="41" label="Add: Other Taxable Income / Non-Operating" base="other" valA={A.otherInc} valB={Bb.otherInc} />
          <CRow no="42" label="Add: Taxable Income from Previous Quarter(s)" base="prevTaxable" valA={A.prevTaxable} valB={Bb.prevTaxable} />
          <CRow no="43" label="Total Taxable Income to Date" base="cum_" roA roB valA={A.taxableCum} valB={Bb.taxableCum} strong />
          <CRow no="46" label="TAX DUE (graduated)" base="gradTax_" roA roB valA={A.gradTax} valB={Bb.gradTax} strong />
        </div>

        <div className="row b" style={{ borderTop: 0, background: "var(--shade)", fontWeight: 700, alignItems: "center", minHeight: 24 }}>
          <div className="grow" style={{ fontSize: 10.6, padding: "2px 8px" }}>
            Schedule II – 8% IT Rate
          </div>
          <div className="amtcell bl br"></div>
          <div className="amtcell br"></div>
        </div>
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="47" label="Total Gross Sales/Receipts & Other Non-Operating Income" base="gross8_" roA roB valA={A.gross8} valB={Bb.gross8} />
          <CRow no="48" label="Add: from Previous Quarter(s)" base="prev8" valA={A.prev8} valB={Bb.prev8} />
          <CRow no="50" label="Less: Allowable reduction (₱250,000 — taxpayer only)" base="reduce8_" roA roB valA={A.reduce8} valB={Bb.reduce8} />
          <CRow no="53" label="Taxable Income to Date" base="taxable8_" roA roB valA={A.taxable8} valB={Bb.taxable8} strong />
          <CRow no="54" label="TAX DUE (8%)" base="tax8_" roA roB valA={A.tax8} valB={Bb.tax8} strong />
        </div>

        <div className="bir-section b" style={{ borderTop: 0 }}>
          Schedule III – Tax Credits/Payments
        </div>
        <div className="b" style={{ borderTop: 0 }}>
          <CRow no="55" label="Prior Year’s Excess Credits" base="excess" valA={A.excess} valB={Bb.excess} />
          <CRow no="56" label="Tax Payment(s) for Previous Quarter(s)" base="prevPaid" valA={A.prevPaid} valB={Bb.prevPaid} />
          <CRow no="57" label="Creditable Tax Withheld per BIR Form 2307" base="cwt" valA={A.cwt} valB={Bb.cwt} />
          <CRow no="62" label="Total Tax Credits/Payments (To Part III Item 27)" base="credT_" roA roB valA={A.credits} valB={Bb.credits} strong />
        </div>

        <div style={{ marginTop: 6 }}>
          <table className="bir-taxtable">
            <thead>
              <tr>
                <th>If Taxable Income is</th>
                <th>Tax Due</th>
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
          <div style={{ fontSize: 8.6, color: "#666", marginTop: 2 }}>
            Rates effective Jan 1, 2023 onward (TRAIN). For 2018–2022 quarters, the prior table applies.
          </div>
        </div>
      </div>
    </>
  );
}

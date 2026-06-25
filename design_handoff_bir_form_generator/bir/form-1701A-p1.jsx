// form-1701A-p1.jsx — 1701A page 1 (background, tax payable, payment details)
// Exports to window: Form1701A_P1

function Form1701A_P1({ tp, data, set, comp }) {
  const T = window.BIR.Taxpayers;
  const pick = (f, v) => set(f, data[f] === v ? "" : v);
  const is = (f, v) => data[f] === v;
  const name = tp ? (tp.kind === "individual"
    ? [tp.lastName, tp.firstName, tp.middleName].filter(Boolean).join(", ")
    : tp.regName) : "";

  // Part II amount row (A=taxpayer, B=spouse)
  function Row2({ no, label, fieldBase, roA, roB, valA, valB, sub }) {
    return (
      <div className="bir-line bt">
        <div className="num">{no}</div>
        <div className="desc">{label}{sub && <small> {sub}</small>}</div>
        <div className="amtcell bl br">
          <BirAmt field={fieldBase + "A"} data={data} set={set} ro={roA} value={valA} />
        </div>
        <div className="amtcell br">
          <BirAmt field={fieldBase + "B"} data={data} set={set} ro={roB} value={valB} />
        </div>
      </div>
    );
  }

  return (
    <div className="bir-sheet">
      {/* ===== HEADER ===== */}
      <div className="row b">
        <div className="bir-formno br">
          <div className="lbl">BIR Form No.</div>
          <div className="no">1701A</div>
          <div className="date">January 2018</div>
          <div className="page">Page 1</div>
        </div>
        <div className="grow col">
          <div className="bir-gov bb" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "3px 14px", minHeight: 44 }}>
            <img src="bir/assets/bir-seal.png" alt="BIR" style={{ width: 50, height: 50, flex: "none" }} />
            <div style={{ textAlign: "center" }}>
              <div className="rep">Republic of the Philippines</div>
              <div className="dof">Department of Finance</div>
              <div className="bureau">Bureau of Internal Revenue</div>
            </div>
          </div>
          <div className="bir-title">
            <div className="t">Annual Income Tax Return</div>
            <div className="sub">Individuals Earning Income PURELY from Business/Profession<br />
              <i>[Those under the graduated income tax rates with OSD as mode of deduction OR those who opted to avail of the 8% flat income tax rate]</i></div>
          </div>
        </div>
        <div className="col bl" style={{ width: 96, flex: "none" }}>
          <div className="bir-foot" style={{ padding: "3px 4px", borderBottom: "0.8px solid var(--ln)", flex: 1 }}>
            <b>For BIR Use Only</b><br />BCS/<br />Item:
          </div>
          <div style={{ fontSize: 7, padding: "2px 4px", textAlign: "center" }}>1701A 01/18 P1</div>
        </div>
      </div>

      <div className="bir-instr bb b" style={{ borderTop: 0 }}>
        Enter all required information in CAPITAL LETTERS using BLACK ink. Mark applicable boxes with an “X”. Two copies must be filed with the BIR and one held by the Tax Filer.
      </div>

      {/* line 1-2-3 */}
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br grow">
          <span className="lblgrp"><span className="bir-ino">1</span> <span className="bir-cap">For the Year (MM/YYYY)</span></span>
          <div className="fld"><BirText field="year" data={data} set={set} placeholder="2024" /></div>
        </div>
        <div className="bir-cell inline br" style={{ width: 230 }}>
          <span className="lblgrp"><span className="bir-ino">2</span> <span className="bir-cap">Amended Return?</span></span>
          <div className="fld" style={{ gap: 14 }}>
            <BirCkRow on={is("amended", "yes")} onClick={() => pick("amended", "yes")}>Yes</BirCkRow>
            <BirCkRow on={is("amended", "no")} onClick={() => pick("amended", "no")}>No</BirCkRow>
          </div>
        </div>
        <div className="bir-cell inline" style={{ width: 230 }}>
          <span className="lblgrp"><span className="bir-ino">3</span> <span className="bir-cap">Short Period Return?</span></span>
          <div className="fld" style={{ gap: 14 }}>
            <BirCkRow on={is("shortPeriod", "yes")} onClick={() => pick("shortPeriod", "yes")}>Yes</BirCkRow>
            <BirCkRow on={is("shortPeriod", "no")} onClick={() => pick("shortPeriod", "no")}>No</BirCkRow>
          </div>
        </div>
      </div>

      <div className="bir-part b" style={{ borderTop: 0 }}>Part I – Background Information on Taxpayer/Filer</div>

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
          <div style={{ marginTop: 3 }}><BirBoxes value={(tp && tp.rdo) || ""} count={3} /></div>
        </div>
        <div className="bir-cell inline grow">
          <span className="lblgrp"><span className="bir-ino">6</span> <span className="bir-cap">Taxpayer Type</span></span>
          <div className="fld" style={{ gap: 16 }}>
            <BirCkRow on={is("taxpayerType", "single")} onClick={() => pick("taxpayerType", "single")}>Single Proprietor</BirCkRow>
            <BirCkRow on={is("taxpayerType", "prof")} onClick={() => pick("taxpayerType", "prof")}>Professional</BirCkRow>
          </div>
        </div>
      </div>

      {/* 7 ATC */}
      <div className="bir-cell inline b" style={{ borderTop: 0, alignItems: "flex-start" }}>
        <span className="lblgrp" style={{ paddingTop: 4 }}><span className="bir-ino">7</span> <span className="bir-cap">Alphanumeric Tax Code (ATC)</span></span>
        <div className="fld atc-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 18px" }}>
          <BirCkRow on={is("atc", "II012")} onClick={() => pick("atc", "II012")}><b>II012</b>&nbsp;Business Income - Graduated IT Rates</BirCkRow>
          <BirCkRow on={is("atc", "II014")} onClick={() => pick("atc", "II014")}><b>II014</b>&nbsp;Income from Profession – Graduated IT Rates</BirCkRow>
          <BirCkRow on={is("atc", "II015")} onClick={() => pick("atc", "II015")}><b>II015</b>&nbsp;Business Income - 8% IT Rate</BirCkRow>
          <BirCkRow on={is("atc", "II017")} onClick={() => pick("atc", "II017")}><b>II017</b>&nbsp;Income from Profession – 8% IT Rate</BirCkRow>
        </div>
      </div>

      {/* 8 name */}
      <div className="bir-cell inline b" style={{ borderTop: 0 }}>
        <span className="lblgrp"><span className="bir-ino">8</span> <span className="bir-cap">Taxpayer’s Name (Last Name, First Name, Middle Name)</span></span>
        <div className="fld"><BirVal value={name} /></div>
      </div>

      {/* 9 address | 9A zip */}
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br grow">
          <span className="lblgrp"><span className="bir-ino">9</span> <span className="bir-cap">Registered Address</span></span>
          <div className="fld"><BirVal value={tp ? [tp.address, tp.city].filter(Boolean).join(", ") : ""} /></div>
        </div>
        <div className="bir-cell inline" style={{ width: 150 }}>
          <span className="lblgrp"><span className="bir-ino">9A</span> <span className="bir-cap">ZIP Code</span></span>
          <div className="fld"><BirVal value={tp && tp.zip} /></div>
        </div>
      </div>

      {/* 10 dob | 11 email */}
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br" style={{ width: 270 }}>
          <span className="lblgrp"><span className="bir-ino">10</span> <span className="bir-cap">Date of Birth (MM/DD/YYYY)</span></span>
          <div className="fld"><BirVal value={tp && tp.birthdate ? fmtDOB(tp.birthdate) : ""} /></div>
        </div>
        <div className="bir-cell inline grow">
          <span className="lblgrp"><span className="bir-ino">11</span> <span className="bir-cap">Email Address</span></span>
          <div className="fld"><BirVal value={tp && tp.email} lower /></div>
        </div>
      </div>

      {/* 12 citizenship | 13 foreign credits | 14 foreign tax no */}
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br" style={{ width: 220 }}>
          <span className="lblgrp"><span className="bir-ino">12</span> <span className="bir-cap">Citizenship</span></span>
          <div className="fld"><BirVal value={tp && tp.citizenship} /></div>
        </div>
        <div className="bir-cell inline br grow">
          <span className="lblgrp"><span className="bir-ino">13</span> <span className="bir-cap">Claiming Foreign Tax Credits?</span></span>
          <div className="fld" style={{ gap: 14 }}>
            <BirCkRow on={is("foreignCredit", "yes")} onClick={() => pick("foreignCredit", "yes")}>Yes</BirCkRow>
            <BirCkRow on={is("foreignCredit", "no")} onClick={() => pick("foreignCredit", "no")}>No</BirCkRow>
          </div>
        </div>
        <div className="bir-cell inline" style={{ width: 230 }}>
          <span className="lblgrp"><span className="bir-ino">14</span> <span className="bir-cap">Foreign Tax Number</span></span>
          <div className="fld"><BirText field="foreignTaxNo" data={data} set={set} /></div>
        </div>
      </div>

      {/* 15 contact | 16 civil status */}
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br" style={{ width: 270 }}>
          <span className="lblgrp"><span className="bir-ino">15</span> <span className="bir-cap">Contact Number</span></span>
          <div className="fld"><BirVal value={tp && tp.phone} lower /></div>
        </div>
        <div className="bir-cell inline grow">
          <span className="lblgrp"><span className="bir-ino">16</span> <span className="bir-cap">Civil Status</span></span>
          <div className="fld" style={{ gap: 12 }}>
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
          <span className="lblgrp"><span className="bir-ino">17</span> <span className="bir-cap">If married, spouse has income?</span></span>
          <div className="fld" style={{ gap: 14 }}>
            <BirCkRow on={is("spouseIncome", "yes")} onClick={() => pick("spouseIncome", "yes")}>Yes</BirCkRow>
            <BirCkRow on={is("spouseIncome", "no")} onClick={() => pick("spouseIncome", "no")}>No</BirCkRow>
          </div>
        </div>
        <div className="bir-cell inline" style={{ width: 320 }}>
          <span className="lblgrp"><span className="bir-ino">18</span> <span className="bir-cap">Filing Status</span></span>
          <div className="fld" style={{ gap: 18 }}>
            <BirCkRow on={is("filing", "joint")} onClick={() => pick("filing", "joint")}>Joint Filing</BirCkRow>
            <BirCkRow on={is("filing", "separate")} onClick={() => pick("filing", "separate")}>Separate Filing</BirCkRow>
          </div>
        </div>
      </div>

      {/* 19 tax rate */}
      <div className="bir-cell inline b" style={{ borderTop: 0, alignItems: "flex-start" }}>
        <span className="lblgrp" style={{ paddingTop: 4 }}><span className="bir-ino">19</span> <span className="bir-cap">Tax Rate</span></span>
        <div className="fld col" style={{ gap: 3, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <BirCkRow on={is("taxRate", "graduated")} onClick={() => pick("taxRate", "graduated")}>Graduated rates with OSD as method of deduction</BirCkRow>
          <BirCkRow on={is("taxRate", "eight")} onClick={() => pick("taxRate", "eight")}>8% in lieu of Graduated Rates under Sec. 24(A) &amp; Percentage Tax under Sec. 116 of NIRC <i>[available if gross sales/receipts and other non-operating income do not exceed Three million pesos (P3M)]</i></BirCkRow>
        </div>
      </div>

      {/* ===== PART II ===== */}
      <div className="bir-part b" style={{ borderTop: 0 }}>Part II – Total Tax Payable <span style={{ fontWeight: 400, fontStyle: "italic" }}>(DO NOT enter Centavos; 49 Centavos or Less drop down; 50 or more round up)</span></div>
      <div className="row b" style={{ borderTop: 0, background: "var(--shade2)", alignItems: "stretch", minHeight: 26 }}>
        <div className="num" style={{ width: 28, flex: "none" }}></div>
        <div className="desc" style={{ flex: 1, fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", padding: "3px 6px" }}>Particulars</div>
        <div className="amtcell bl br bir-amthead" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>A) Taxpayer/Filer</div>
        <div className="amtcell br bir-amthead" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>B) Spouse</div>
      </div>
      <div className="b" style={{ borderTop: 0 }}>
        <Row2 no="20" label="Tax Due" sub="(Either from Part IV.A Item 46 OR Part IV.B Item 56)" fieldBase="i20" roA roB valA={comp.A.i20} valB={comp.B.i20} />
        <Row2 no="21" label="Less: Total Tax Credits/Payments" sub="(From Part IV.C Item 64)" fieldBase="i21" roA roB valA={comp.A.i21} valB={comp.B.i21} />
        <Row2 no="22" label="Net Tax Payable/(Overpayment)" sub="(Item 20 Less Item 21)" fieldBase="i22" roA roB valA={comp.A.i22} valB={comp.B.i22} />
        <Row2 no="23" label="Less: Portion of Tax Payable Allowed for 2nd Installment (50% or less of Item 20)" fieldBase="i23" valA={comp.A.i23} valB={comp.B.i23} />
        <Row2 no="24" label="Amount of Tax Payable/(Overpayment)" sub="(Item 22 Less Item 23)" fieldBase="i24" roA roB valA={comp.A.i24} valB={comp.B.i24} />
        <div className="bir-line bt"><div className="num"></div><div className="desc" style={{ fontWeight: 700, fontStyle: "italic" }}>Add: Penalties</div><div className="amtcell bl br"></div><div className="amtcell br"></div></div>
        <Row2 no="25" label="Surcharge" fieldBase="i25" valA={comp.A.i25} valB={comp.B.i25} />
        <Row2 no="26" label="Interest" fieldBase="i26" valA={comp.A.i26} valB={comp.B.i26} />
        <Row2 no="27" label="Compromise" fieldBase="i27" valA={comp.A.i27} valB={comp.B.i27} />
        <Row2 no="28" label="Total Penalties (Sum of Items 25 to 27)" fieldBase="i28" roA roB valA={comp.A.i28} valB={comp.B.i28} />
        <Row2 no="29" label="Total Amount Payable/(Overpayment) (Sum of Items 24 and 28)" fieldBase="i29" roA roB valA={comp.A.i29} valB={comp.B.i29} />
        <div className="bir-line bt" style={{ background: "var(--shade2)" }}>
          <div className="num">30</div>
          <div className="desc" style={{ fontWeight: 700 }}>Aggregate Amount Payable/(Overpayment) (Sum of Items 29A &amp; 29B)</div>
          <div className="amtcell bl br" style={{ width: 300 }}><BirAmt ro value={comp.i30} /></div>
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

      {/* perjury + signature (left) | attachments (right) — matches official layout */}
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="col br grow">
          <div className="bir-perjury bb" style={{ flex: 1 }}>
            I declare under the penalties of perjury that this return, and all its attachments, have been made in good faith, verified by me, and to the best of my knowledge and belief, are true and correct, pursuant to the provisions of the National Internal Revenue Code, as amended, and the regulations issued under authority thereof. Further, I give my consent to the processing of my information as contemplated under the *Data Privacy Act of 2012 (R.A. No. 10173) for legitimate and lawful purposes. (If signed by an Authorized Representative, indicate TIN and attach authorization letter)
          </div>
          <div className="bir-sign" style={{ padding: "6px 6px 3px" }}>
            <BirVal value={name} />
            <div style={{ borderTop: "0.7px solid var(--ln)", marginTop: 3, paddingTop: 3 }}>Printed Name and Signature of Taxpayer/Authorized Representative</div>
          </div>
        </div>
        <div className="bir-cell" style={{ width: 250, flex: "none" }}>
          <span className="bir-ino">31</span> <span className="bir-cap">Number of Attachments</span>
          <div style={{ width: 120, marginTop: 6 }}><BirText field="attachments" data={data} set={set} /></div>
        </div>
      </div>

      {/* part III payment */}
      <div className="bir-part b" style={{ borderTop: 0 }}>Part III - Details of Payment</div>
      <div className="row b" style={{ borderTop: 0, background: "var(--shade2)", fontSize: 9.6, fontWeight: 700 }}>
        <div style={{ width: 180, padding: "3px 5px" }} className="br">Particulars</div>
        <div className="grow br" style={{ padding: "3px 5px" }}>Drawee Bank/Agency</div>
        <div style={{ width: 130, padding: "3px 5px" }} className="br">Number</div>
        <div style={{ width: 120, padding: "3px 5px" }} className="br">Date (MM/DD/YYYY)</div>
        <div style={{ width: 130, padding: "3px 5px", textAlign: "center" }}>Amount</div>
      </div>
      {[["32", "Cash/Bank Debit Memo", "p32"], ["33", "Check", "p33"], ["34", "Tax Debit Memo", "p34"], ["35", "Others (specify below)", "p35"]].map(([no, lbl, k]) => (
        <div className="row b" style={{ borderTop: 0 }} key={k}>
          <div style={{ width: 180 }} className="bir-cell br"><span className="bir-ino">{no}</span> <span className="bir-cap">{lbl}</span></div>
          <div className="grow br"><BirText field={k + "bank"} data={data} set={set} /></div>
          <div style={{ width: 130 }} className="br"><BirText field={k + "num"} data={data} set={set} /></div>
          <div style={{ width: 120 }} className="br"><BirText field={k + "date"} data={data} set={set} lower /></div>
          <div style={{ width: 130 }}><BirAmt field={k + "amt"} data={data} set={set} /></div>
        </div>
      ))}
      <div className="bir-foot b" style={{ borderTop: 0, display: "flex", minHeight: 58 }}>
        <div className="grow br" style={{ padding: "5px 7px" }}>Machine Validation/Revenue Official Receipt Details (if not filed with an Authorized Agent Bank)</div>
        <div style={{ width: 300, padding: "5px 7px" }}>Stamp of Receiving Office/AAB and Date of Receipt (RO’s Signature/Bank Teller’s Initial)</div>
      </div>
      <div style={{ fontSize: 9, fontWeight: 700, padding: "4px 2px 0" }}>*NOTE: The BIR Data Privacy Policy is in the BIR website (www.bir.gov.ph)</div>
    </div>
  );
}

function fmtDOB(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return m + "/" + d + "/" + y;
}

window.Form1701A_P1 = Form1701A_P1;

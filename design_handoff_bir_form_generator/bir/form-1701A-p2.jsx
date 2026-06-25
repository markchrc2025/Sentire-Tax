// form-1701A-p2.jsx — 1701A page 2 (computation of income tax, spouse, tax tables)
// Exports to window: Form1701A_P2, Form1701A (wrapper rendering both pages)

function Form1701A_P2({ tp, data, set, comp }) {
  const pick = (f, v) => set(f, data[f] === v ? "" : v);
  const is = (f, v) => data[f] === v;
  const lastName = tp ? (tp.kind === "individual" ? tp.lastName : tp.regName) : "";

  // computation row with A/B columns; editable unless ro
  function CRow({ no, label, sub, base, roA, roB, valA, valB, strong, indent }) {
    return (
      <div className="bir-line bt">
        <div className="num">{no}</div>
        <div className="desc" style={{ fontWeight: strong ? 700 : 400, paddingLeft: indent ? 14 : 4 }}>
          {label}{sub && <small> {sub}</small>}
        </div>
        <div className="amtcell bl br"><BirAmt field={base + "A"} data={data} set={set} ro={roA} value={valA} /></div>
        <div className="amtcell br"><BirAmt field={base + "B"} data={data} set={set} ro={roB} value={valB} /></div>
      </div>
    );
  }

  return (
    <div className="bir-sheet" data-rate={data.taxRate || "graduated"}>
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
          <div className="sub">Individuals Earning Income PURELY from Business/Profession<br />
            <i>[Those under the graduated income tax rates with OSD as mode of deduction OR those who opted to avail of the 8% flat income tax rate]</i></div>
        </div>
        <div className="bl col" style={{ width: 96, flex: "none" }}>
          <div className="grow" style={{ padding: 4 }}>
            <div style={{ fontSize: 8 }}><b>For BIR Use Only</b><br />BCS/<br />Item:</div>
          </div>
          <div style={{ fontSize: 8, padding: "2px 4px", textAlign: "right" }}>1701A 01/18 P2</div>
        </div>
      </div>

      {/* TIN / Last Name band (full width) */}
      <div className="row b" style={{ borderTop: 0, background: "var(--shade2)" }}>
        <div className="grow br" style={{ padding: "2px 6px" }}><span className="bir-cap" style={{ fontWeight: 700 }}>TIN</span></div>
        <div style={{ width: 360, flex: "none", padding: "2px 6px" }}><span className="bir-cap" style={{ fontWeight: 700 }}>Tax Filer’s Last Name</span></div>
      </div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell br grow" style={{ minHeight: 24, display: "flex", alignItems: "center" }}>
          <BirBoxes value={(tp && tp.tin) || ""} count={14} groups={[3, 3, 3, 5]} />
        </div>
        <div className="bir-cell" style={{ width: 360, flex: "none", minHeight: 24, display: "flex", alignItems: "center" }}>
          <BirVal value={lastName} />
        </div>
      </div>

      <div className="bir-part b" style={{ borderTop: 0 }}>Part IV – Computation of Income Tax</div>
      <div className="bir-instr b" style={{ borderTop: 0 }}>
        If Optional Standard Deductions (OSD), fill in items 36 to 46; if 8%, fill in items 47 to 56 (DO NOT enter Centavos; 49 Centavos or Less drop down; 50 or more round up)
      </div>

      {/* IV.A header */}
      <div className="row b" style={{ borderTop: 0, background: "var(--shade2)", alignItems: "stretch" }}>
        <div className="grow" style={{ fontWeight: 700, fontSize: 10.6, display: "flex", alignItems: "center", padding: "2px 8px" }}>IV.A – For Graduated Income Tax Rates</div>
        <div className="amtcell bl br bir-amthead" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>A) Taxpayer/Filer</div>
        <div className="amtcell br bir-amthead" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>B) Spouse</div>
      </div>
      <div className="b when-grad" style={{ borderTop: 0 }}>
        <CRow no="36" label="Sales/Revenues/Receipts/Fees" base="i36" valA={comp.A.i36} valB={comp.B.i36} />
        <CRow no="37" label="Less: Sales Returns, Allowances and Discounts" base="i37" valA={comp.A.i37} valB={comp.B.i37} />
        <CRow no="38" label="Net Sales/Revenues/Receipts/Fees" sub="(Item 36 Less Item 37)" base="i38" roA roB valA={comp.A.i38} valB={comp.B.i38} />
        <CRow no="39" label="Less: Allowable Deduction - Optional Standard Deduction (OSD)" sub="(40% of Item 38)" base="i39" roA roB valA={comp.A.i39} valB={comp.B.i39} />
        <CRow no="40" label="Net Income (Item 38 Less Item 39)" base="i40" roA roB valA={comp.A.i40} valB={comp.B.i40} />
        <div className="bir-line bt"><div className="num"></div><div className="desc" style={{ fontStyle: "italic", fontWeight: 700 }}>Add: Other Non-Operating Income (specify below)</div><div className="amtcell bl br"></div><div className="amtcell br"></div></div>
        <CRow no="41" label={<BirText field="i41label" data={data} set={set} placeholder="specify" />} base="i41" valA={comp.A.i41} valB={comp.B.i41} />
        <CRow no="42" label={<BirText field="i42label" data={data} set={set} placeholder="specify" />} base="i42" valA={comp.A.i42} valB={comp.B.i42} />
        <CRow no="43" label="Amount Received/Share in Income by a Partner from General Professional Partnership (GPP)" base="i43" valA={comp.A.i43} valB={comp.B.i43} />
        <CRow no="44" label="Total Other Income (Sum of Items 41 to 43)" base="i44" roA roB valA={comp.A.i44} valB={comp.B.i44} />
        <CRow no="45" label="Total Taxable Income (Sum of Items 40 and 44)" base="i45" roA roB valA={comp.A.i45} valB={comp.B.i45} strong />
        <CRow no="46" label="TAX DUE (Item 45 x Applicable Tax Rate based on Tax Table below) (To Part II – Item 20)" base="i46" roA roB valA={comp.A.i46} valB={comp.B.i46} strong />
      </div>

      {/* IV.B header */}
      <div className="row b" style={{ borderTop: 0, background: "var(--shade2)", alignItems: "stretch" }}>
        <div className="grow" style={{ fontWeight: 700, fontSize: 10.6, display: "flex", alignItems: "center", padding: "2px 8px" }}>IV.B – For 8% Income Tax Rate <span style={{ fontWeight: 400, fontStyle: "italic", marginLeft: 4 }}>(opted at the initial quarter; sales/receipts did not exceed P3M)</span></div>
        <div className="amtcell bl br"></div>
        <div className="amtcell br"></div>
      </div>
      <div className="b when-eight" style={{ borderTop: 0 }}>
        <CRow no="47" label="Sales/Revenues/Receipts/Fees" base="i47" valA={comp.A.i47} valB={comp.B.i47} />
        <CRow no="48" label="Less: Sales Returns, Allowances and Discounts" base="i48" valA={comp.A.i48} valB={comp.B.i48} />
        <CRow no="49" label="Net Sales/Revenues/Receipts/Fees (Item 47 Less Item 48)" base="i49" roA roB valA={comp.A.i49} valB={comp.B.i49} />
        <div className="bir-line bt"><div className="num"></div><div className="desc" style={{ fontStyle: "italic", fontWeight: 700 }}>Add: Other Non-Operating Income (specify below)</div><div className="amtcell bl br"></div><div className="amtcell br"></div></div>
        <CRow no="50" label={<BirText field="i50label" data={data} set={set} placeholder="specify" />} base="i50" valA={comp.A.i50} valB={comp.B.i50} />
        <CRow no="51" label={<BirText field="i51label" data={data} set={set} placeholder="specify" />} base="i51" valA={comp.A.i51} valB={comp.B.i51} />
        <CRow no="52" label="Total Other Non-operating Income (Sum of Items 50 and 51)" base="i52" roA roB valA={comp.A.i52} valB={comp.B.i52} />
        <CRow no="53" label="Total Taxable Income (Sum of Items 49 and 52)" base="i53" roA roB valA={comp.A.i53} valB={comp.B.i53} />
        <CRow no="54" label="Less: Allowable reduction of P 250,000 (purely self-employed individuals and/or professionals)" base="i54" roA roB valA={comp.A.i54} valB={comp.B.i54} />
        <CRow no="55" label="Taxable Income/(Loss) (Item 53 Less Item 54)" base="i55" roA roB valA={comp.A.i55} valB={comp.B.i55} strong />
        <CRow no="56" label="TAX DUE (Item 55 x 8% Income Tax Rate) (To Part II - Item 20)" base="i56" roA roB valA={comp.A.i56} valB={comp.B.i56} strong />
      </div>

      {/* IV.C credits */}
      <div className="bir-section b" style={{ borderTop: 0 }}>IV.C - Tax Credits/Payments (attach proof)</div>
      <div className="b" style={{ borderTop: 0 }}>
        <CRow no="57" label="Prior Year’s Excess Credits" base="i57" valA={comp.A.i57} valB={comp.B.i57} />
        <CRow no="58" label="Tax Payments for the First Three (3) Quarters" base="i58" valA={comp.A.i58} valB={comp.B.i58} />
        <CRow no="59" label="Creditable Tax Withheld for the First Three (3) Quarters" base="i59" valA={comp.A.i59} valB={comp.B.i59} />
        <CRow no="60" label="Creditable Tax Withheld per BIR Form No. 2307 for the 4th Quarter" base="i60" valA={comp.A.i60} valB={comp.B.i60} />
        <CRow no="61" label="Tax Paid in Return Previously Filed, if this is an Amended Return" base="i61" valA={comp.A.i61} valB={comp.B.i61} />
        <CRow no="62" label="Foreign Tax Credits, if applicable" base="i62" valA={comp.A.i62} valB={comp.B.i62} />
        <CRow no="63" label="Other Tax Credits/Payments (specify)" base="i63" valA={comp.A.i63} valB={comp.B.i63} />
        <CRow no="64" label="Total Tax Credits/Payments (Sum of Items 57 to 63) (To Item 21)" base="i64" roA roB valA={comp.A.i64} valB={comp.B.i64} strong />
        <CRow no="65" label="Net Tax Payable/(Overpayment) (Item 46 OR 56 Less Item 64) (To Part II - Item 22)" base="i65" roA roB valA={comp.A.i65} valB={comp.B.i65} strong />
      </div>

      {/* Part V spouse background (condensed) */}
      <div className="bir-part b" style={{ borderTop: 0 }}>Part V – Background Information on Spouse</div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell br" style={{ width: 270 }}>
          <span className="bir-ino">66</span> <span className="bir-cap">Spouse’s TIN</span>
          <div style={{ marginTop: 3 }}><BirBoxes value={data.spouseTin || ""} count={14} groups={[3, 3, 3, 5]} /></div>
        </div>
        <div className="bir-cell br" style={{ width: 96 }}>
          <span className="bir-ino">67</span> <span className="bir-cap">RDO Code</span>
          <div style={{ marginTop: 3 }}><BirBoxes value={data.spouseRdo || ""} count={3} /></div>
        </div>
        <div className="bir-cell grow">
          <span className="bir-ino">68</span> <span className="bir-cap">Filer’s Spouse Type</span>
          <div className="row" style={{ gap: 16, marginTop: 3 }}>
            <BirCkRow on={is("spouseType", "single")} onClick={() => pick("spouseType", "single")}>Single Proprietor</BirCkRow>
            <BirCkRow on={is("spouseType", "prof")} onClick={() => pick("spouseType", "prof")}>Professional</BirCkRow>
          </div>
        </div>
      </div>
      <div className="bir-cell b" style={{ borderTop: 0 }}>
        <span className="bir-ino">70</span> <span className="bir-cap">Spouse’s Name (Last Name, First Name, Middle Name)</span>
        <BirText field="spouseName" data={data} set={set} />
      </div>

      {/* tax tables */}
      <div className="row" style={{ marginTop: 6, gap: 8 }}>
        <div className="grow">
          <table className="bir-taxtable">
            <thead><tr><th colSpan="2">TABLE 1 – Tax Rates (effective Jan 1, 2018 to Dec 31, 2022)</th></tr>
              <tr><th>If Taxable Income is:</th><th>Tax Due is:</th></tr></thead>
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
            <thead><tr><th colSpan="2">TABLE 2 – Tax Rates (effective Jan 1, 2023 and onwards)</th></tr>
              <tr><th>If Taxable Income is:</th><th>Tax Due is:</th></tr></thead>
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
  );
}

function Form1701A({ tp, data, set, comp }) {
  return (
    <>
      <Form1701A_P1 tp={tp} data={data} set={set} comp={comp} />
      <Form1701A_P2 tp={tp} data={data} set={set} comp={comp} />
    </>
  );
}

Object.assign(window, { Form1701A_P2, Form1701A });

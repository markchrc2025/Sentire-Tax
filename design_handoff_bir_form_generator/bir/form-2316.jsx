// form-2316.jsx — Certificate of Compensation Payment / Tax Withheld
// Exports: Form2316

function Form2316({ tp, data, set, comp }) {
  const name = tp ? (tp.kind === "individual"
    ? [tp.lastName, tp.firstName, tp.middleName].filter(Boolean).join(", ") : tp.regName) : "";
  const dob = tp && tp.birthdate ? (() => { const [y, m, d] = tp.birthdate.split("-"); return m + "/" + d + "/" + y; })() : "";

  const NTrow = (no, label, field) => (
    <div className="bir-line bt"><div className="num">{no}</div><div className="desc">{label}</div><div className="amtcell bl br" style={{ width: 200 }}><BirAmt field={field} data={data} set={set} /></div></div>
  );

  return (
    <div className="bir-sheet">
      <BirHeader code="2316" date="September 2021 (ENCS)" page="1" title="Certificate of Compensation Payment/Tax Withheld" sub="For Compensation Payment With or Without Tax Withheld" pcode="2316 9/21 ENCS" />
      <div className="bir-instr bb b" style={{ borderTop: 0 }}>Fill in all applicable spaces. Mark all appropriate boxes with an “X”.</div>

      {/* year/period */}
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br" style={{ width: 240 }}>
          <span className="lblgrp"><span className="bir-ino">1</span> <span className="bir-cap">For the Year (YYYY)</span></span>
          <div className="fld"><BirText field="year" data={data} set={set} placeholder="2024" /></div>
        </div>
        <div className="bir-cell inline grow">
          <span className="lblgrp"><span className="bir-ino">2</span> <span className="bir-cap">For the Period</span></span>
          <div className="fld" style={{ gap: 8 }}>
            <span style={{ fontSize: 9.5 }}>From (MM/DD)</span><div style={{ width: 110 }}><BirText field="from" data={data} set={set} lower /></div>
            <span style={{ fontSize: 9.5 }}>To (MM/DD)</span><div style={{ width: 110 }}><BirText field="to" data={data} set={set} lower /></div>
          </div>
        </div>
      </div>

      {/* Part I employee */}
      <PartBand>Part I – Employee Information</PartBand>
      <div className="bir-cell b" style={{ borderTop: 0 }}>
        <span className="bir-ino">3</span> <span className="bir-cap">TIN</span>
        <div style={{ marginTop: 3 }}><BirBoxes value={(tp && tp.tin) || ""} count={14} groups={[3, 3, 3, 5]} /></div>
      </div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br grow"><span className="lblgrp"><span className="bir-ino">4</span> <span className="bir-cap">Employee’s Name</span></span><div className="fld"><BirVal value={name} /></div></div>
        <div className="bir-cell inline" style={{ width: 150 }}><span className="lblgrp"><span className="bir-ino">5</span> <span className="bir-cap">RDO Code</span></span><div className="fld"><BirVal value={tp && tp.rdo} /></div></div>
      </div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br grow"><span className="lblgrp"><span className="bir-ino">6</span> <span className="bir-cap">Registered Address</span></span><div className="fld"><BirVal value={tp ? [tp.address, tp.city].filter(Boolean).join(", ") : ""} /></div></div>
        <div className="bir-cell inline" style={{ width: 150 }}><span className="lblgrp"><span className="bir-ino">6A</span> <span className="bir-cap">ZIP</span></span><div className="fld"><BirVal value={tp && tp.zip} /></div></div>
      </div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br" style={{ width: 320 }}><span className="lblgrp"><span className="bir-ino">7</span> <span className="bir-cap">Date of Birth</span></span><div className="fld"><BirVal value={dob} /></div></div>
        <div className="bir-cell inline grow"><span className="lblgrp"><span className="bir-ino">8</span> <span className="bir-cap">Contact Number</span></span><div className="fld"><BirVal value={tp && tp.phone} lower /></div></div>
      </div>

      {/* Part II employer present */}
      <PartBand>Part II – Employer Information (Present)</PartBand>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell b br" style={{ width: 360, border: 0 }}>
          <span className="bir-ino">12</span> <span className="bir-cap">TIN</span>
          <div style={{ marginTop: 3 }}><BirBoxes value={data.empTin || ""} count={14} groups={[3, 3, 3, 5]} /></div>
        </div>
        <div className="bir-cell inline grow"><span className="lblgrp"><span className="bir-ino">13</span> <span className="bir-cap">Employer’s Name</span></span><div className="fld"><BirText field="empName" data={data} set={set} /></div></div>
      </div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br grow"><span className="lblgrp"><span className="bir-ino">14</span> <span className="bir-cap">Registered Address</span></span><div className="fld"><BirText field="empAddr" data={data} set={set} /></div></div>
        <div className="bir-cell inline" style={{ width: 150 }}><span className="lblgrp"><span className="bir-ino">14A</span> <span className="bir-cap">ZIP</span></span><div className="fld"><BirText field="empZip" data={data} set={set} /></div></div>
      </div>

      {/* Part IV-A summary + IV-B details */}
      <div className="row" style={{ alignItems: "stretch" }}>
        {/* left: IV-B details */}
        <div className="col br b grow" style={{ borderTop: 0, borderRight: 0 }}>
          <div className="bir-section bb">Part IV-B – Details of Compensation Income &amp; Tax Withheld</div>
          <div className="bir-line" style={{ background: "var(--shade)", fontWeight: 700 }}><div className="num"></div><div className="desc">A. Non-Taxable / Exempt Compensation</div><div className="amtcell bl" style={{ width: 200, textAlign: "center", fontSize: 9, paddingTop: 4 }}>Amount</div></div>
          {NTrow("29", "Basic Salary (incl. exempt ₱250,000 & below / SMW)", "i29")}
          {NTrow("30", "Holiday Pay (MWE)", "i30")}
          {NTrow("31", "Overtime Pay (MWE)", "i31")}
          {NTrow("32", "Night Shift Differential (MWE)", "i32")}
          {NTrow("33", "Hazard Pay (MWE)", "i33")}
          {NTrow("34", "13th Month Pay & Other Benefits (max ₱90,000)", "i34")}
          {NTrow("35", "De Minimis Benefits", "i35")}
          {NTrow("36", "SSS, GSIS, PHIC, Pag-IBIG & Union Dues", "i36")}
          {NTrow("37", "Salaries & Other Forms of Compensation", "i37")}
          <div className="bir-line bt" style={{ background: "var(--shade2)", fontWeight: 700 }}><div className="num">38</div><div className="desc">Total Non-Taxable/Exempt (Sum 29 to 37)</div><div className="amtcell bl br" style={{ width: 200 }}><BirAmt ro value={comp.i38} /></div></div>

          <div className="bir-line bt" style={{ background: "var(--shade)", fontWeight: 700 }}><div className="num"></div><div className="desc">B. Taxable Compensation Income (Regular)</div><div className="amtcell bl" style={{ width: 200 }}></div></div>
          {NTrow("39", "Basic Salary", "i39")}
          {NTrow("40", "Representation", "i40")}
          {NTrow("41", "Transportation", "i41")}
          {NTrow("42", "Cost of Living Allowance (COLA)", "i42")}
          {NTrow("43", "Fixed Housing Allowance", "i43")}
          {NTrow("50", "Taxable 13th Month & Other Benefits", "i50")}
          {NTrow("51", "Others / Supplementary", "i51")}
          <div className="bir-line bt" style={{ background: "var(--shade2)", fontWeight: 700 }}><div className="num">26</div><div className="desc">Total Taxable Compensation Income</div><div className="amtcell bl br" style={{ width: 200 }}><BirAmt ro value={comp.i26} /></div></div>
        </div>

        {/* right: IV-A summary */}
        <div className="col b" style={{ borderTop: 0, width: 330, flex: "none" }}>
          <div className="bir-section bb">Part IV-A – Summary</div>
          {[["19", "Gross Compensation Income (Present)", comp.i19],
            ["20", "Less: Total Non-Taxable/Exempt", comp.i20],
            ["21", "Taxable Compensation (Present)", comp.i21]].map(([no, l, v]) => (
            <div className="bir-line bt" key={no}><div className="num">{no}</div><div className="desc" style={{ fontSize: 9.6 }}>{l}</div><div className="amtcell bl" style={{ width: 130 }}><BirAmt ro value={v} /></div></div>
          ))}
          <div className="bir-line bt"><div className="num">22</div><div className="desc" style={{ fontSize: 9.6 }}>Add: Taxable Comp. from Previous Employer</div><div className="amtcell bl" style={{ width: 130 }}><BirAmt field="i22" data={data} set={set} /></div></div>
          <div className="bir-line bt" style={{ background: "var(--shade2)", fontWeight: 700 }}><div className="num">23</div><div className="desc" style={{ fontSize: 9.6 }}>Gross Taxable Compensation Income</div><div className="amtcell bl" style={{ width: 130 }}><BirAmt ro value={comp.i23} /></div></div>
          <div className="bir-line bt" style={{ background: "var(--shade2)", fontWeight: 700 }}><div className="num">24</div><div className="desc" style={{ fontSize: 9.6 }}>Tax Due</div><div className="amtcell bl" style={{ width: 130 }}><BirAmt ro value={comp.i24} /></div></div>
          <div className="bir-line bt"><div className="num">25A</div><div className="desc" style={{ fontSize: 9.6 }}>Taxes Withheld – Present Employer</div><div className="amtcell bl" style={{ width: 130 }}><BirAmt field="i25A" data={data} set={set} /></div></div>
          <div className="bir-line bt"><div className="num">25B</div><div className="desc" style={{ fontSize: 9.6 }}>Taxes Withheld – Previous Employer</div><div className="amtcell bl" style={{ width: 130 }}><BirAmt field="i25B" data={data} set={set} /></div></div>
          <div className="bir-line bt"><div className="num">27</div><div className="desc" style={{ fontSize: 9.6 }}>5% Tax Credit (PERA Act of 2008)</div><div className="amtcell bl" style={{ width: 130 }}><BirAmt field="i27" data={data} set={set} /></div></div>
          <div className="bir-line bt" style={{ background: "var(--shade2)", fontWeight: 700 }}><div className="num">28</div><div className="desc" style={{ fontSize: 9.6 }}>Total Taxes Withheld</div><div className="amtcell bl" style={{ width: 130 }}><BirAmt ro value={comp.i28} /></div></div>
          {comp.i24 - comp.i28 !== 0 && (
            <div className="bir-line bt" style={{ background: comp.i24 > comp.i28 ? "#fbeeec" : "#eef6f1", fontWeight: 700 }}>
              <div className="num"></div><div className="desc" style={{ fontSize: 9.6 }}>{comp.i24 > comp.i28 ? "Tax still due" : "Over-withheld / refund"}</div>
              <div className="amtcell bl" style={{ width: 130 }}><BirAmt ro value={Math.abs(comp.i24 - comp.i28)} /></div></div>
          )}
        </div>
      </div>

      {/* signatures */}
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-sign br grow" style={{ padding: "20px 6px 4px" }}>
          <BirText field="empSig" data={data} set={set} />
          <div style={{ borderTop: "0.7px solid var(--ln)", marginTop: 3, paddingTop: 3 }}>Present Employer/Authorized Agent — Signature over Printed Name</div>
        </div>
        <div className="bir-sign grow" style={{ padding: "20px 6px 4px" }}>
          <BirVal value={name} />
          <div style={{ borderTop: "0.7px solid var(--ln)", marginTop: 3, paddingTop: 3 }}>Employee — Signature over Printed Name</div>
        </div>
      </div>
    </div>
  );
}

window.Form2316 = Form2316;

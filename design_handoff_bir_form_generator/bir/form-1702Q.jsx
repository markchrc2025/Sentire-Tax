// form-1702Q.jsx — Quarterly ITR for Corporations/Partnerships/Other Non-Individual
// Exports: Form1702Q

function Form1702Q({ tp, data, set, comp }) {
  const pick = (f, v) => set(f, data[f] === v ? "" : v);
  const is = (f, v) => data[f] === v;
  const regName = tp ? (tp.kind === "individual" ? [tp.lastName, tp.firstName].filter(Boolean).join(", ") : tp.regName) : "";

  function L1({ no, label, sub, field, ro, value, strong, bg }) {
    return (
      <div className="bir-line bt" style={bg ? { background: "var(--shade2)" } : null}>
        <div className="num">{no}</div>
        <div className="desc" style={{ fontWeight: strong ? 700 : 400 }}>{label}{sub && <small> {sub}</small>}</div>
        <div className="amtcell bl br" style={{ width: 220 }}><BirAmt field={field} data={data} set={set} ro={ro} value={value} /></div>
      </div>
    );
  }

  return (
    <>
      {/* PAGE 1 */}
      <div className="bir-sheet">
        <BirHeader code="1702Q" date="January 2018 (ENCS)" page="1" title="Quarterly Income Tax Return" sub="For Corporations, Partnerships and Other Non-Individual Taxpayers" pcode="1702Q 01/18 ENCS P1" />
        <div className="bir-instr bb b" style={{ borderTop: 0 }}>Enter all required information in CAPITAL LETTERS. Mark applicable boxes with an “X”. Two copies MUST be filed with the BIR and one held by the taxpayer.</div>

        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br" style={{ width: 190 }}>
            <span className="lblgrp"><span className="bir-ino">1</span> <span className="bir-cap">Period</span></span>
            <div className="fld" style={{ gap: 8 }}>
              <BirCkRow on={is("periodType", "calendar")} onClick={() => pick("periodType", "calendar")}>Calendar</BirCkRow>
              <BirCkRow on={is("periodType", "fiscal")} onClick={() => pick("periodType", "fiscal")}>Fiscal</BirCkRow>
            </div>
          </div>
          <div className="bir-cell inline br" style={{ width: 200 }}>
            <span className="lblgrp"><span className="bir-ino">2</span> <span className="bir-cap">Year Ended (MM/YYYY)</span></span>
            <div className="fld"><BirText field="year" data={data} set={set} placeholder="2024" /></div>
          </div>
          <div className="bir-cell inline br grow">
            <span className="lblgrp"><span className="bir-ino">3</span> <span className="bir-cap">Quarter</span></span>
            <div className="fld" style={{ gap: 10 }}>
              {["1st", "2nd", "3rd"].map((q) => <BirCkRow key={q} on={is("quarter", q)} onClick={() => pick("quarter", q)}>{q}</BirCkRow>)}
            </div>
          </div>
          <div className="bir-cell inline" style={{ width: 180 }}>
            <span className="lblgrp"><span className="bir-ino">4</span> <span className="bir-cap">Amended?</span></span>
            <div className="fld" style={{ gap: 8 }}>
              <BirCkRow on={is("amended", "yes")} onClick={() => pick("amended", "yes")}>Yes</BirCkRow>
              <BirCkRow on={is("amended", "no")} onClick={() => pick("amended", "no")}>No</BirCkRow>
            </div>
          </div>
        </div>

        <PartBand>Part I – Background Information</PartBand>
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell br" style={{ width: 360 }}>
            <span className="bir-ino">6</span> <span className="bir-cap">TIN</span>
            <div style={{ marginTop: 3 }}><BirBoxes value={(tp && tp.tin) || ""} count={14} groups={[3, 3, 3, 5]} /></div>
          </div>
          <div className="bir-cell" style={{ width: 130 }}>
            <span className="bir-ino">7</span> <span className="bir-cap">RDO Code</span>
            <div style={{ marginTop: 3 }}><BirBoxes value={(tp && tp.rdo) || ""} count={3} /></div>
          </div>
        </div>
        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp"><span className="bir-ino">8</span> <span className="bir-cap">Registered Name</span></span>
          <div className="fld"><BirVal value={regName} /></div>
        </div>
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br grow"><span className="lblgrp"><span className="bir-ino">9</span> <span className="bir-cap">Registered Address</span></span><div className="fld"><BirVal value={tp ? [tp.address, tp.city].filter(Boolean).join(", ") : ""} /></div></div>
          <div className="bir-cell inline" style={{ width: 150 }}><span className="lblgrp"><span className="bir-ino">9A</span> <span className="bir-cap">ZIP</span></span><div className="fld"><BirVal value={tp && tp.zip} /></div></div>
        </div>
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br" style={{ width: 360 }}><span className="lblgrp"><span className="bir-ino">10</span> <span className="bir-cap">Contact Number</span></span><div className="fld"><BirVal value={tp && tp.phone} lower /></div></div>
          <div className="bir-cell inline grow"><span className="lblgrp"><span className="bir-ino">11</span> <span className="bir-cap">Email</span></span><div className="fld"><BirVal value={tp && tp.email} lower /></div></div>
        </div>
        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp"><span className="bir-ino">12</span> <span className="bir-cap">Method of Deductions</span></span>
          <div className="fld" style={{ gap: 16 }}>
            <BirCkRow on={is("method", "itemized")} onClick={() => pick("method", "itemized")}>Itemized Deductions</BirCkRow>
            <BirCkRow on={is("method", "osd")} onClick={() => pick("method", "osd")}>Optional Standard Deduction (OSD) — 40% of Gross Income</BirCkRow>
          </div>
        </div>

        <PartBand>Part II – Total Tax Payable</PartBand>
        <div className="b" style={{ borderTop: 0 }}>
          <L1 no="14" label="Income Tax Due – Regular/Normal Rate (From Sch. 2 Item 13)" ro value={comp.i14} strong />
          <L1 no="15" label="Less: Unexpired Excess of Prior Year’s MCIT over Regular Tax" field="i15" />
          <L1 no="16" label="Balance / Income Tax Still Due – Regular Rate (Item 14 Less 15)" ro value={comp.i16} />
          <L1 no="17" label="Add: Income Tax Due – Special Rate (From Sch. 1 Item 13)" field="i17" />
          <L1 no="18" label="Aggregate Income Tax Due (Sum of Items 16 and 17)" ro value={comp.i18} strong />
          <L1 no="19" label="Less: Total Tax Credits/Payments (From Sch. 4 Item 7)" field="i19" />
          <L1 no="20" label="Net Tax Payable / (Overpayment) (Item 18 Less 19)" ro value={comp.i20} strong />
          <div className="bir-line bt"><div className="num"></div><div className="desc" style={{ fontStyle: "italic", fontWeight: 700 }}>Add: Penalties</div><div className="amtcell bl br" style={{ width: 220 }}></div></div>
          <L1 no="21" label="Surcharge" field="i21" />
          <L1 no="22" label="Interest" field="i22" />
          <L1 no="23" label="Compromise" field="i23" />
          <L1 no="24" label="Total Penalties (Sum of Items 21 to 23)" ro value={comp.i24} strong />
          <L1 no="25" label="TOTAL AMOUNT PAYABLE / (Overpayment) (Sum of Items 20 and 24)" ro value={comp.i25} strong bg />
        </div>

        <div className="b" style={{ borderTop: 0 }}>
          <div className="bir-perjury bb">We declare under the penalties of perjury that this return, and all its attachments, have been made in good faith, verified by us, and to the best of our knowledge and belief, are true and correct, pursuant to the provisions of the National Internal Revenue Code, as amended.</div>
          <div className="row">
            <div className="bir-sign br grow" style={{ padding: "18px 6px 4px" }}>
              <BirVal value={regName} />
              <div style={{ borderTop: "0.7px solid var(--ln)", marginTop: 3, paddingTop: 3 }}>President/Principal Officer/Authorized Representative</div>
            </div>
            <div className="bir-sign grow" style={{ padding: "18px 6px 4px" }}>
              <BirText field="treasurer" data={data} set={set} />
              <div style={{ borderTop: "0.7px solid var(--ln)", marginTop: 3, paddingTop: 3 }}>Treasurer/Assistant Treasurer</div>
            </div>
          </div>
        </div>

        <PaymentDetails data={data} set={set} startNo={27} />
      </div>

      {/* PAGE 2 — Part IV Schedules */}
      <div className="bir-sheet">
        <BirHeader code="1702Q" date="January 2018 (ENCS)" page="2" title="Quarterly Income Tax Return" sub="For Corporations, Partnerships and Other Non-Individual Taxpayers" pcode="1702Q 01/18 ENCS P2" />
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br grow"><span className="lblgrp"><span className="bir-cap">TIN</span></span><div className="fld"><BirBoxes value={(tp && tp.tin) || ""} count={14} groups={[3, 3, 3, 5]} /></div></div>
          <div className="bir-cell inline grow"><span className="lblgrp"><span className="bir-cap">Registered Name</span></span><div className="fld"><BirVal value={regName} /></div></div>
        </div>

        <PartBand>Part IV – Schedules</PartBand>
        <div className="bir-section b" style={{ borderTop: 0 }}>Schedule 2 – Declaration this Quarter — REGULAR / NORMAL RATE</div>
        <div className="b" style={{ borderTop: 0 }}>
          <L1 no="1" label="Sales/Receipts/Revenues/Fees" field="s2_1" />
          <L1 no="2" label="Less: Cost of Sales/Services" field="s2_2" />
          <L1 no="3" label="Gross Income from Operation (Item 1 Less 2)" ro value={comp.s2_3} strong />
          <L1 no="4" label="Add: Non-Operating and Other Taxable Income" field="s2_4" />
          <L1 no="5" label="Total Gross Income (Sum of Items 3 and 4)" ro value={comp.s2_5} strong />
          <L1 no="6" label="Less: Deductions (Itemized entry or OSD auto-40% of gross income)" field="s2_6" ro={comp.method === "osd"} value={comp.method === "osd" ? comp.s2_6 : undefined} />
          <L1 no="7" label="Taxable Income this Quarter (Item 5 Less 6)" ro value={comp.s2_7} strong />
          <L1 no="8" label="Add: Taxable Income Previous Quarter/s" field="s2_8" />
          <L1 no="9" label="Total Taxable Income to Date (Sum of Items 7 and 8)" ro value={comp.s2_9} strong />
          <div className="bir-line bt">
            <div className="num">10</div>
            <div className="desc">Applicable Income Tax Rate (except MCIT)</div>
            <div className="amtcell bl br" style={{ width: 220, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2, paddingRight: 6 }}>
              <input className="bir-rate" inputMode="decimal" value={data.rate == null ? "25" : data.rate}
                onChange={(e) => set("rate", e.target.value.replace(/[^0-9.]/g, ""))} />
              <span style={{ fontSize: 11, color: "#555" }}>%</span>
            </div>
          </div>
          <L1 no="11" label="Income Tax Due Other than MCIT (Item 9 × Item 10)" ro value={comp.s2_11} />
          <L1 no="12" label="Minimum Corporate Income Tax — MCIT (2% of total gross income)" ro value={comp.mcit} />
          <L1 no="13" label="Income Tax Due (higher of Item 11 or MCIT) (To Part II Item 14)" ro value={comp.s2_13} strong bg />
        </div>

        {comp.mcitApplies && (
          <div style={{ marginTop: 6, fontSize: 10, color: "#b07a2e", background: "#fdf6ec", border: "1px solid #f0dcae", borderRadius: 6, padding: "6px 10px" }}>
            ⚠ MCIT (2% of gross income) exceeds the normal income tax — MCIT is used as the income tax due this quarter.
          </div>
        )}
        <div style={{ marginTop: 6, fontSize: 10, color: "#555" }}>
          Quarterly corporate income tax uses cumulative figures to date. Tax due is the higher of the normal tax (rate × taxable income) or the 2% MCIT on gross income.
        </div>
      </div>
    </>
  );
}

window.Form1702Q = Form1702Q;

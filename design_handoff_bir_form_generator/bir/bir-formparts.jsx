// bir-formparts.jsx — shared faithful-form building blocks for returns
// Exports: BirHeader, BgInfoReturn, PaymentDetails, PenaltyNote, PartBand, FootMeta

function BirHeader({ code, date, page, title, sub, pcode }) {
  return (
    <div className="row b">
      <div className="bir-formno br">
        <div className="lbl">BIR Form No.</div>
        <div className="no">{code}</div>
        <div className="date">{date}</div>
        <div className="page">Page {page}</div>
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
          <div className="t">{title}</div>
          {sub && <div className="sub">{sub}</div>}
        </div>
      </div>
      <div className="col bl" style={{ width: 96, flex: "none" }}>
        <div className="bir-foot" style={{ padding: "3px 4px", borderBottom: "0.8px solid var(--ln)", flex: 1 }}>
          <b>For BIR Use Only</b><br />BCS/<br />Item:
        </div>
        <div style={{ fontSize: 7, padding: "2px 4px", textAlign: "center" }}>{pcode}</div>
      </div>
    </div>
  );
}

function PartBand({ children, sub }) {
  return (
    <div className="bir-part b" style={{ borderTop: 0, textAlign: "center" }}>
      {children}{sub && <span style={{ fontWeight: 400, fontStyle: "italic" }}> {sub}</span>}
    </div>
  );
}

// Standard Part I background for returns (TIN/RDO/name/address/contact/email)
function BgInfoReturn({ tp, data, set, startNo }) {
  const name = tp ? (tp.kind === "individual"
    ? [tp.lastName, tp.firstName, tp.middleName].filter(Boolean).join(", ")
    : tp.regName) : "";
  const n = startNo || 6;
  return (
    <>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell br" style={{ width: 360 }}>
          <span className="bir-ino">{n}</span> <span className="bir-cap">Taxpayer Identification Number (TIN)</span>
          <div style={{ marginTop: 3 }}><BirBoxes value={(tp && tp.tin) || ""} count={14} groups={[3, 3, 3, 5]} /></div>
        </div>
        <div className="bir-cell" style={{ width: 130 }}>
          <span className="bir-ino">{n + 1}</span> <span className="bir-cap">RDO Code</span>
          <div style={{ marginTop: 3 }}><BirBoxes value={(tp && tp.rdo) || ""} count={3} /></div>
        </div>
      </div>
      <div className="bir-cell inline b" style={{ borderTop: 0 }}>
        <span className="lblgrp"><span className="bir-ino">{n + 2}</span> <span className="bir-cap">Taxpayer’s Name</span></span>
        <div className="fld"><BirVal value={name} /></div>
      </div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br grow">
          <span className="lblgrp"><span className="bir-ino">{n + 3}</span> <span className="bir-cap">Registered Address</span></span>
          <div className="fld"><BirVal value={tp ? [tp.address, tp.city].filter(Boolean).join(", ") : ""} /></div>
        </div>
        <div className="bir-cell inline" style={{ width: 150 }}>
          <span className="lblgrp"><span className="bir-ino">{n + 3}A</span> <span className="bir-cap">ZIP Code</span></span>
          <div className="fld"><BirVal value={tp && tp.zip} /></div>
        </div>
      </div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br" style={{ width: 360 }}>
          <span className="lblgrp"><span className="bir-ino">{n + 4}</span> <span className="bir-cap">Contact Number</span></span>
          <div className="fld"><BirVal value={tp && tp.phone} lower /></div>
        </div>
        <div className="bir-cell inline grow">
          <span className="lblgrp"><span className="bir-ino">{n + 5}</span> <span className="bir-cap">Email Address</span></span>
          <div className="fld"><BirVal value={tp && tp.email} lower /></div>
        </div>
      </div>
    </>
  );
}

// Part III details of payment (4 rows)
function PaymentDetails({ data, set, startNo, title }) {
  const n = startNo;
  return (
    <>
      <PartBand>{title || "Part III – Details of Payment"}</PartBand>
      <div className="row b" style={{ borderTop: 0, background: "var(--shade2)", fontSize: 9.6, fontWeight: 700 }}>
        <div style={{ width: 200, padding: "3px 5px" }} className="br">Particulars</div>
        <div className="grow br" style={{ padding: "3px 5px" }}>Drawee Bank/Agency</div>
        <div style={{ width: 130, padding: "3px 5px" }} className="br">Number</div>
        <div style={{ width: 130, padding: "3px 5px" }} className="br">Date (MM/DD/YYYY)</div>
        <div style={{ width: 140, padding: "3px 5px", textAlign: "center" }}>Amount</div>
      </div>
      {[[n, "Cash/Bank Debit Memo"], [n + 1, "Check"], [n + 2, "Tax Debit Memo"], [n + 3, "Others (specify below)"]].map(([no, lbl]) => {
        const k = "pay" + no;
        return (
          <div className="row b" style={{ borderTop: 0 }} key={k}>
            <div style={{ width: 200 }} className="bir-cell br"><span className="bir-ino">{no}</span> <span className="bir-cap">{lbl}</span></div>
            <div className="grow br"><BirText field={k + "bank"} data={data} set={set} /></div>
            <div style={{ width: 130 }} className="br"><BirText field={k + "num"} data={data} set={set} /></div>
            <div style={{ width: 130 }} className="br"><BirText field={k + "date"} data={data} set={set} lower /></div>
            <div style={{ width: 140 }}><BirAmt field={k + "amt"} data={data} set={set} /></div>
          </div>
        );
      })}
      <div className="bir-foot b" style={{ borderTop: 0, display: "flex", minHeight: 52 }}>
        <div className="grow br" style={{ padding: "5px 7px" }}>Machine Validation/Revenue Official Receipt Details (if not filed with an Authorized Agent Bank)</div>
        <div style={{ width: 300, padding: "5px 7px" }}>Stamp of Receiving Office/AAB and Date of Receipt (RO’s Signature/Bank Teller’s Initial)</div>
      </div>
    </>
  );
}

// Declaration + signature block
function DeclSign({ name, indiv }) {
  return (
    <div className="b" style={{ borderTop: 0 }}>
      <div className="bir-perjury bb">
        I/We declare under the penalties of perjury that this return, and all its attachments, have been made in good faith, verified by me/us, and to the best of my/our knowledge and belief, is true and correct, pursuant to the provisions of the National Internal Revenue Code, as amended. Further, I/we give my/our consent to the processing of my/our information as contemplated under the *Data Privacy Act of 2012 (R.A. No. 10173) for legitimate and lawful purposes. (If Authorized Representative, attach authorization letter and indicate TIN)
      </div>
      <div className="bir-sign" style={{ padding: "18px 6px 4px", textAlign: "center" }}>
        <BirVal value={name} />
        <div style={{ borderTop: "0.7px solid var(--ln)", marginTop: 3, paddingTop: 3, maxWidth: 480, margin: "3px auto 0" }}>Signature over Printed Name of Taxpayer/Authorized Representative/Tax Agent (Indicate title/designation and TIN)</div>
      </div>
    </div>
  );
}

// row helper: number | label | single amount (computed or editable)
function LineAmt({ no, label, sub, field, data, set, ro, value, strong, bg }) {
  return (
    <div className="bir-line bt" style={bg ? { background: "var(--shade2)" } : null}>
      <div className="num">{no}</div>
      <div className="desc" style={{ fontWeight: strong ? 700 : 400 }}>{label}{sub && <small> {sub}</small>}</div>
      <div className="amtcell bl br" style={{ width: 220 }}>
        <BirAmt field={field} data={data} set={set} ro={ro} value={value} />
      </div>
    </div>
  );
}

Object.assign(window, { BirHeader, PartBand, BgInfoReturn, PaymentDetails, DeclSign, LineAmt });

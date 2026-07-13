// Form2316.tsx — faithful 2316 replica (Certificate of Compensation Payment / Tax Withheld, Sep 2021 ENCS).
// Two views per form (Guided wizard + this faithful, A4 printable form) stay in sync via the shared
// computeFor result. Row helpers are INLINE FUNCTION CALLS (`{NTrow(...)}`) — never a component that
// renders <input> and is mounted as JSX, which would remount on each keystroke and drop the cursor.

import type { ReactNode } from "react";
import { tin14 } from "../../lib/taxpayer";
import type { Comp2316 } from "../../lib/compute";
import type { FormProps } from "../formProps";
import { BirHeader, PartBand } from "../formparts";
import { BirAmt, BirBoxes, BirCkRow, BirText, BirVal } from "../formkit";

export function Form2316({ tp, data, set, comp }: FormProps<Comp2316>) {
  const name = tp
    ? tp.kind === "individual"
      ? [tp.lastName, tp.firstName, tp.middleName].filter(Boolean).join(", ")
      : tp.regName
    : "";
  const dob =
    tp && tp.birthdate
      ? (() => {
          const [y, m, d] = tp.birthdate.split("-");
          return m + "/" + d + "/" + y;
        })()
      : "";

  const pick = (f: string, v: string) => set(f, data[f] === v ? "" : v);
  const is = (f: string, v: string) => data[f] === v;

  // Inline editable amount detail row (label | amount). Function call — not a JSX component.
  const NTrow = (no: ReactNode, label: ReactNode, field: string) => (
    <div className="bir-line bt">
      <div className="num">{no}</div>
      <div className="desc">{label}</div>
      <div className="amtcell bl br" style={{ width: 200 }}>
        <BirAmt field={field} data={data} set={set} />
      </div>
    </div>
  );

  // Inline "Others (specify)" detail row: free-text description + amount.
  const SpecRow = (no: ReactNode, descField: string, amtField: string) => (
    <div className="bir-line bt">
      <div className="num">{no}</div>
      <div className="desc">
        <BirText field={descField} data={data} set={set} placeholder="Others (specify)" />
      </div>
      <div className="amtcell bl br" style={{ width: 200 }}>
        <BirAmt field={amtField} data={data} set={set} />
      </div>
    </div>
  );

  const summaryRows: Array<[string, string, number]> = [
    ["19", "Gross Compensation Income from Present Employer (Sum of Items 38 and 52)", comp.i19],
    ["20", "Less: Total Non-Taxable/Exempt Compensation Income from Present Employer (From Item 38)", comp.i20],
    ["21", "Taxable Compensation Income from Present Employer (Item 19 Less Item 20) (From Item 52)", comp.i21],
  ];

  return (
    <div className="bir-sheet">
      <BirHeader
        code="2316"
        date="September 2021 (ENCS)"
        page="1"
        title="Certificate of Compensation Payment/Tax Withheld"
        sub="For Compensation Payment With or Without Tax Withheld"
        pcode="2316 9/21 ENCS"
      />
      <div className="bir-instr bb b" style={{ borderTop: 0 }}>
        Fill in all applicable spaces. Mark all appropriate boxes with an &ldquo;X&rdquo;.
      </div>

      {/* year/period */}
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br" style={{ width: 240 }}>
          <span className="lblgrp">
            <span className="bir-ino">1</span> <span className="bir-cap">For the Year (YYYY)</span>
          </span>
          <div className="fld">
            <BirText field="year" data={data} set={set} placeholder="2024" />
          </div>
        </div>
        <div className="bir-cell inline grow">
          <span className="lblgrp">
            <span className="bir-ino">2</span> <span className="bir-cap">For the Period</span>
          </span>
          <div className="fld" style={{ gap: 8 }}>
            <span style={{ fontSize: 9.5 }}>From (MM/DD)</span>
            <div style={{ width: 110 }}>
              <BirText field="from" data={data} set={set} lower />
            </div>
            <span style={{ fontSize: 9.5 }}>To (MM/DD)</span>
            <div style={{ width: 110 }}>
              <BirText field="to" data={data} set={set} lower />
            </div>
          </div>
        </div>
      </div>

      {/* Part I employee */}
      <PartBand>Part I – Employee Information</PartBand>
      <div className="bir-cell b" style={{ borderTop: 0 }}>
        <span className="bir-ino">3</span> <span className="bir-cap">TIN</span>
        <div style={{ marginTop: 3 }}>
          <BirBoxes value={tin14(tp && tp.tin, tp && tp.branch)} count={14} groups={[3, 3, 3, 5]} />
        </div>
      </div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br grow">
          <span className="lblgrp">
            <span className="bir-ino">4</span>{" "}
            <span className="bir-cap">Employee&rsquo;s Name (Last Name, First Name, Middle Name)</span>
          </span>
          <div className="fld">
            <BirVal value={name} />
          </div>
        </div>
        <div className="bir-cell inline" style={{ flex: "0 0 150px" }}>
          <span className="lblgrp">
            <span className="bir-ino">5</span> <span className="bir-cap">RDO Code</span>
          </span>
          <div className="fld">
            <BirVal value={tp && tp.rdo} />
          </div>
        </div>
      </div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br grow">
          <span className="lblgrp">
            <span className="bir-ino">6</span> <span className="bir-cap">Registered Address</span>
          </span>
          <div className="fld">
            <BirVal value={tp ? [tp.address, tp.city].filter(Boolean).join(", ") : ""} fit />
          </div>
        </div>
        <div className="bir-cell inline" style={{ flex: "0 0 150px" }}>
          <span className="lblgrp">
            <span className="bir-ino">6A</span> <span className="bir-cap">ZIP Code</span>
          </span>
          <div className="fld">
            <BirVal value={tp && tp.zip} />
          </div>
        </div>
      </div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br grow">
          <span className="lblgrp">
            <span className="bir-ino">6B</span> <span className="bir-cap">Local Home Address</span>
          </span>
          <div className="fld">
            <BirText field="empLocalAddr" data={data} set={set} />
          </div>
        </div>
        <div className="bir-cell inline" style={{ flex: "0 0 150px" }}>
          <span className="lblgrp">
            <span className="bir-ino">6C</span> <span className="bir-cap">ZIP Code</span>
          </span>
          <div className="fld">
            <BirText field="empLocalZip" data={data} set={set} />
          </div>
        </div>
      </div>
      <div className="bir-cell inline b" style={{ borderTop: 0 }}>
        <span className="lblgrp">
          <span className="bir-ino">6D</span> <span className="bir-cap">Foreign Address</span>
        </span>
        <div className="fld">
          <BirText field="empForeignAddr" data={data} set={set} />
        </div>
      </div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br" style={{ width: 320 }}>
          <span className="lblgrp">
            <span className="bir-ino">7</span> <span className="bir-cap">Date of Birth (MM/DD/YYYY)</span>
          </span>
          <div className="fld">
            <BirVal value={dob} />
          </div>
        </div>
        <div className="bir-cell inline grow">
          <span className="lblgrp">
            <span className="bir-ino">8</span> <span className="bir-cap">Contact Number</span>
          </span>
          <div className="fld">
            <BirVal value={tp && tp.phone} lower />
          </div>
        </div>
      </div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br grow">
          <span className="lblgrp">
            <span className="bir-ino">9</span>{" "}
            <span className="bir-cap">Statutory Minimum Wage rate per day</span>
          </span>
          <div className="fld">
            <BirText field="smwDay" data={data} set={set} lower />
          </div>
        </div>
        <div className="bir-cell inline grow">
          <span className="lblgrp">
            <span className="bir-ino">10</span>{" "}
            <span className="bir-cap">Statutory Minimum Wage rate per month</span>
          </span>
          <div className="fld">
            <BirText field="smwMonth" data={data} set={set} lower />
          </div>
        </div>
      </div>
      <div className="bir-cell b" style={{ borderTop: 0 }}>
        <BirCkRow on={is("mwe", "yes")} onClick={() => pick("mwe", "yes")}>
          Minimum Wage Earner (MWE) whose compensation is exempt from withholding tax and not subject to income tax
        </BirCkRow>
      </div>

      {/* Part II employer present */}
      <PartBand>Part II – Employer Information (Present)</PartBand>
      <div className="bir-cell inline b" style={{ borderTop: 0 }}>
        <span className="lblgrp">
          <span className="bir-ino">11</span> <span className="bir-cap">Type of Employer</span>
        </span>
        <div className="fld" style={{ gap: 18 }}>
          <BirCkRow on={is("empType", "main")} onClick={() => pick("empType", "main")}>
            Main Employer
          </BirCkRow>
          <BirCkRow on={is("empType", "secondary")} onClick={() => pick("empType", "secondary")}>
            Secondary Employer
          </BirCkRow>
        </div>
      </div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell b br" style={{ width: 360, border: 0 }}>
          <span className="bir-ino">12</span> <span className="bir-cap">TIN</span>
          <div style={{ marginTop: 3 }}>
            <BirBoxes value={tin14(data.empTin as string)} count={14} groups={[3, 3, 3, 5]} />
          </div>
        </div>
        <div className="bir-cell inline grow">
          <span className="lblgrp">
            <span className="bir-ino">13</span> <span className="bir-cap">Employer&rsquo;s Name</span>
          </span>
          <div className="fld">
            <BirText field="empName" data={data} set={set} />
          </div>
        </div>
      </div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br grow">
          <span className="lblgrp">
            <span className="bir-ino">14</span> <span className="bir-cap">Registered Address</span>
          </span>
          <div className="fld">
            <BirText field="empAddr" data={data} set={set} />
          </div>
        </div>
        <div className="bir-cell inline" style={{ flex: "0 0 150px" }}>
          <span className="lblgrp">
            <span className="bir-ino">14A</span> <span className="bir-cap">ZIP Code</span>
          </span>
          <div className="fld">
            <BirText field="empZip" data={data} set={set} />
          </div>
        </div>
      </div>

      {/* Part III employer previous */}
      <PartBand>Part III – Employer Information (Previous)</PartBand>
      <div className="bir-cell inline b" style={{ borderTop: 0 }}>
        <span className="lblgrp">
          <span className="bir-ino">15</span> <span className="bir-cap">Type of Employer</span>
        </span>
        <div className="fld" style={{ gap: 18 }}>
          <BirCkRow on={is("prevEmpType", "main")} onClick={() => pick("prevEmpType", "main")}>
            Main Employer
          </BirCkRow>
          <BirCkRow on={is("prevEmpType", "secondary")} onClick={() => pick("prevEmpType", "secondary")}>
            Secondary Employer
          </BirCkRow>
        </div>
      </div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell b br" style={{ width: 360, border: 0 }}>
          <span className="bir-ino">16</span> <span className="bir-cap">TIN</span>
          <div style={{ marginTop: 3 }}>
            <BirBoxes value={tin14(data.prevEmpTin as string)} count={14} groups={[3, 3, 3, 5]} />
          </div>
        </div>
        <div className="bir-cell inline grow">
          <span className="lblgrp">
            <span className="bir-ino">17</span> <span className="bir-cap">Employer&rsquo;s Name</span>
          </span>
          <div className="fld">
            <BirText field="prevEmpName" data={data} set={set} />
          </div>
        </div>
      </div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br grow">
          <span className="lblgrp">
            <span className="bir-ino">18</span> <span className="bir-cap">Registered Address</span>
          </span>
          <div className="fld">
            <BirText field="prevEmpAddr" data={data} set={set} />
          </div>
        </div>
        <div className="bir-cell inline" style={{ flex: "0 0 150px" }}>
          <span className="lblgrp">
            <span className="bir-ino">18A</span> <span className="bir-cap">ZIP Code</span>
          </span>
          <div className="fld">
            <BirText field="prevEmpZip" data={data} set={set} />
          </div>
        </div>
      </div>

      {/* Part IV-A summary + IV-B details */}
      <div className="row" style={{ alignItems: "stretch" }}>
        {/* left: IV-B details */}
        <div className="col br b grow" style={{ borderTop: 0, borderRight: 0 }}>
          <div className="bir-section bb">
            Part IV-B – Details of Compensation Income &amp; Tax Withheld from Present Employer
          </div>
          <div className="bir-line" style={{ background: "var(--shade)", fontWeight: 700 }}>
            <div className="num"></div>
            <div className="desc">A. Non-Taxable / Exempt Compensation Income</div>
            <div className="amtcell bl" style={{ width: 200, textAlign: "center", fontSize: 9, paddingTop: 4 }}>
              Amount
            </div>
          </div>
          {NTrow("29", "Basic Salary (incl. exempt ₱250,000 & below) / SMW of the MWE", "i29")}
          {NTrow("30", "Holiday Pay (MWE)", "i30")}
          {NTrow("31", "Overtime Pay (MWE)", "i31")}
          {NTrow("32", "Night Shift Differential (MWE)", "i32")}
          {NTrow("33", "Hazard Pay (MWE)", "i33")}
          {NTrow("34", "13th Month Pay and Other Benefits (maximum of ₱90,000)", "i34")}
          {NTrow("35", "De Minimis Benefits", "i35")}
          {NTrow("36", "SSS, GSIS, PHIC & Pag-IBIG Contributions and Union Dues (Employee share only)", "i36")}
          {NTrow("37", "Salaries and Other Forms of Compensation", "i37")}
          <div className="bir-line bt" style={{ background: "var(--shade2)", fontWeight: 700 }}>
            <div className="num">38</div>
            <div className="desc">Total Non-Taxable/Exempt Compensation Income (Sum of Items 29 to 37)</div>
            <div className="amtcell bl br" style={{ width: 200 }}>
              <BirAmt ro value={comp.i38} />
            </div>
          </div>

          <div className="bir-line bt" style={{ background: "var(--shade)", fontWeight: 700 }}>
            <div className="num"></div>
            <div className="desc">B. Taxable Compensation Income — REGULAR</div>
            <div className="amtcell bl" style={{ width: 200 }}></div>
          </div>
          {NTrow("39", "Basic Salary", "i39")}
          {NTrow("40", "Representation", "i40")}
          {NTrow("41", "Transportation", "i41")}
          {NTrow("42", "Cost of Living Allowance (COLA)", "i42")}
          {NTrow("43", "Fixed Housing Allowance", "i43")}
          {SpecRow("44A", "i44Adesc", "i44A")}
          {SpecRow("44B", "i44Bdesc", "i44B")}

          <div className="bir-line bt" style={{ background: "var(--shade)", fontWeight: 700 }}>
            <div className="num"></div>
            <div className="desc">SUPPLEMENTARY</div>
            <div className="amtcell bl" style={{ width: 200 }}></div>
          </div>
          {NTrow("45", "Commission", "i45")}
          {NTrow("46", "Profit Sharing", "i46")}
          {NTrow("47", "Fees Including Director's Fees", "i47")}
          {NTrow("48", "Taxable 13th Month Benefits", "i48")}
          {NTrow("49", "Hazard Pay", "i49")}
          {NTrow("50", "Overtime Pay", "i50")}
          {SpecRow("51A", "i51Adesc", "i51A")}
          {SpecRow("51B", "i51Bdesc", "i51B")}
          <div className="bir-line bt" style={{ background: "var(--shade2)", fontWeight: 700 }}>
            <div className="num">52</div>
            <div className="desc">Total Taxable Compensation Income (Sum of Items 39 to 51B)</div>
            <div className="amtcell bl br" style={{ width: 200 }}>
              <BirAmt ro value={comp.i52} />
            </div>
          </div>
        </div>

        {/* right: IV-A summary */}
        <div className="col b" style={{ borderTop: 0, width: 330, flex: "none" }}>
          <div className="bir-section bb">Part IV-A – Summary</div>
          {summaryRows.map(([no, l, v]) => (
            <div className="bir-line bt" key={no}>
              <div className="num">{no}</div>
              <div className="desc" style={{ fontSize: 9.6 }}>
                {l}
              </div>
              <div className="amtcell bl" style={{ width: 130 }}>
                <BirAmt ro value={v} />
              </div>
            </div>
          ))}
          <div className="bir-line bt">
            <div className="num">22</div>
            <div className="desc" style={{ fontSize: 9.6 }}>
              Add: Taxable Compensation Income from Previous Employer, if applicable
            </div>
            <div className="amtcell bl" style={{ width: 130 }}>
              <BirAmt field="i22" data={data} set={set} />
            </div>
          </div>
          <div className="bir-line bt" style={{ background: "var(--shade2)", fontWeight: 700 }}>
            <div className="num">23</div>
            <div className="desc" style={{ fontSize: 9.6 }}>
              Gross Taxable Compensation Income (Sum of Items 21 and 22)
            </div>
            <div className="amtcell bl" style={{ width: 130 }}>
              <BirAmt ro value={comp.i23} />
            </div>
          </div>
          <div className="bir-line bt" style={{ background: "var(--shade2)", fontWeight: 700 }}>
            <div className="num">24</div>
            <div className="desc" style={{ fontSize: 9.6 }}>
              Tax Due
            </div>
            <div className="amtcell bl" style={{ width: 130 }}>
              <BirAmt ro value={comp.i24} />
            </div>
          </div>
          <div className="bir-line bt" style={{ background: "var(--shade)", fontWeight: 700 }}>
            <div className="num">25</div>
            <div className="desc" style={{ fontSize: 9.6 }}>
              Amount of Taxes Withheld
            </div>
            <div className="amtcell bl" style={{ width: 130 }}></div>
          </div>
          <div className="bir-line bt">
            <div className="num">25A</div>
            <div className="desc" style={{ fontSize: 9.6 }}>
              Present Employer
            </div>
            <div className="amtcell bl" style={{ width: 130 }}>
              <BirAmt field="i25A" data={data} set={set} />
            </div>
          </div>
          <div className="bir-line bt">
            <div className="num">25B</div>
            <div className="desc" style={{ fontSize: 9.6 }}>
              Previous Employer, if applicable
            </div>
            <div className="amtcell bl" style={{ width: 130 }}>
              <BirAmt field="i25B" data={data} set={set} />
            </div>
          </div>
          <div className="bir-line bt" style={{ background: "var(--shade2)", fontWeight: 700 }}>
            <div className="num">26</div>
            <div className="desc" style={{ fontSize: 9.6 }}>
              Total Amount of Taxes Withheld as adjusted (Sum of Items 25A and 25B)
            </div>
            <div className="amtcell bl" style={{ width: 130 }}>
              <BirAmt ro value={comp.i26} />
            </div>
          </div>
          <div className="bir-line bt">
            <div className="num">27</div>
            <div className="desc" style={{ fontSize: 9.6 }}>
              5% Tax Credit (PERA Act of 2008)
            </div>
            <div className="amtcell bl" style={{ width: 130 }}>
              <BirAmt field="i27" data={data} set={set} />
            </div>
          </div>
          <div className="bir-line bt" style={{ background: "var(--shade2)", fontWeight: 700 }}>
            <div className="num">28</div>
            <div className="desc" style={{ fontSize: 9.6 }}>
              Total Taxes Withheld (Sum of Items 26 and 27)
            </div>
            <div className="amtcell bl" style={{ width: 130 }}>
              <BirAmt ro value={comp.i28} />
            </div>
          </div>
          {comp.i24 - comp.i28 !== 0 && (
            <div
              className="bir-line bt"
              style={{ background: comp.i24 > comp.i28 ? "#fbeeec" : "#eef6f1", fontWeight: 700 }}
            >
              <div className="num"></div>
              <div className="desc" style={{ fontSize: 9.6 }}>
                {comp.i24 > comp.i28 ? "Tax still due" : "Over-withheld / refund"}
              </div>
              <div className="amtcell bl" style={{ width: 130 }}>
                <BirAmt ro value={Math.abs(comp.i24 - comp.i28)} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Employer declaration + signature */}
      <div className="b" style={{ borderTop: 0 }}>
        <div className="bir-perjury bb">
          I/We declare, under the penalties of perjury that this certificate has been made in good faith, verified by
          me/us, and to the best of my/our knowledge and belief, is true and correct, pursuant to the provisions of the
          National Internal Revenue Code, as amended, and the regulations issued under authority thereof. Further, I/we
          give my/our consent to the processing of my/our information as contemplated under the *Data Privacy Act of
          2012 (R.A. No. 10173) for legitimate and lawful purposes.
        </div>
        <div className="row" style={{ borderTop: 0 }}>
          <div className="bir-sign br grow" style={{ padding: "20px 6px 4px" }}>
            <BirText field="empSig" data={data} set={set} />
            <div style={{ borderTop: "0.7px solid var(--ln)", marginTop: 3, paddingTop: 3 }}>
              Present Employer/Authorized Agent Signature over Printed Name
              <br />
              (Head of Accounting/Human Resource or Authorized Representative)
            </div>
          </div>
          <div className="bir-sign grow" style={{ padding: "20px 6px 4px" }}>
            <BirText field="empSigDate" data={data} set={set} lower />
            <div style={{ borderTop: "0.7px solid var(--ln)", marginTop: 3, paddingTop: 3 }}>
              Date Signed
            </div>
          </div>
        </div>
      </div>

      {/* Conforme / employee signature (item 53-56) */}
      <div className="bir-section b" style={{ borderTop: 0 }}>CONFORME:</div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-cell inline br grow">
          <span className="lblgrp">
            <span className="bir-ino">53</span> <span className="bir-cap">CTC/Valid ID No. of Employee</span>
          </span>
          <div className="fld">
            <BirText field="empeeCtcNo" data={data} set={set} lower />
          </div>
        </div>
        <div className="bir-cell inline br grow">
          <span className="lblgrp">
            <span className="bir-ino">54</span> <span className="bir-cap">Place of Issue</span>
          </span>
          <div className="fld">
            <BirText field="empeeCtcPlace" data={data} set={set} />
          </div>
        </div>
        <div className="bir-cell inline br" style={{ width: 170 }}>
          <span className="lblgrp">
            <span className="bir-ino">55</span> <span className="bir-cap">Amount paid, if CTC</span>
          </span>
          <div className="fld">
            <BirText field="empeeCtcAmt" data={data} set={set} lower />
          </div>
        </div>
        <div className="bir-cell inline" style={{ width: 170 }}>
          <span className="lblgrp">
            <span className="bir-ino">56</span> <span className="bir-cap">Date of Issue (MM/DD/YYYY)</span>
          </span>
          <div className="fld">
            <BirText field="empeeCtcDate" data={data} set={set} lower />
          </div>
        </div>
      </div>
      <div className="row b" style={{ borderTop: 0 }}>
        <div className="bir-sign br grow" style={{ padding: "20px 6px 4px" }}>
          <BirVal value={name} />
          <div style={{ borderTop: "0.7px solid var(--ln)", marginTop: 3, paddingTop: 3 }}>
            Employee Signature over Printed Name
          </div>
        </div>
        <div className="bir-sign grow" style={{ padding: "20px 6px 4px" }}>
          <BirText field="empeeSigDate" data={data} set={set} lower />
          <div style={{ borderTop: "0.7px solid var(--ln)", marginTop: 3, paddingTop: 3 }}>
            Date Signed
          </div>
        </div>
      </div>

      {/* Substituted-filing declaration */}
      <div className="b" style={{ borderTop: 0 }}>
        <div className="bir-perjury" style={{ fontWeight: 700, borderBottom: 0 }}>
          To be accomplished under substituted filing
        </div>
        <div className="bir-perjury bb" style={{ borderTop: 0 }}>
          I declare, under the penalties of perjury that I am qualified under substituted filing of Income Tax Return
          (BIR Form No. 1700), since I received purely compensation income from only one employer in the Philippines for
          the calendar year; that taxes have been correctly withheld by my employer (tax due equals tax withheld); that
          the BIR Form No. 1604-C filed by my employer to the BIR shall constitute as my income tax return; and that BIR
          Form No. 2316 shall serve the same purpose as if BIR Form No. 1700 has been filed pursuant to the provisions of
          Revenue Regulations (RR) No. 3-2002, as amended.
        </div>
        <div className="row" style={{ borderTop: 0 }}>
          <div className="bir-sign br grow" style={{ padding: "20px 6px 4px" }}>
            <BirVal value={name} />
            <div style={{ borderTop: "0.7px solid var(--ln)", marginTop: 3, paddingTop: 3 }}>
              Employee Signature over Printed Name
            </div>
          </div>
          <div className="bir-sign br grow" style={{ padding: "20px 6px 4px" }}>
            <BirText field="subEmpSig" data={data} set={set} />
            <div style={{ borderTop: "0.7px solid var(--ln)", marginTop: 3, paddingTop: 3 }}>
              Present Employer/Authorized Agent Signature over Printed Name
            </div>
          </div>
          <div className="bir-sign grow" style={{ padding: "20px 6px 4px" }}>
            <BirText field="subDate" data={data} set={set} lower />
            <div style={{ borderTop: "0.7px solid var(--ln)", marginTop: 3, paddingTop: 3 }}>
              Date Signed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

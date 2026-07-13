// Form1702RT.tsx — faithful 4-page replica of BIR Form 1702-RT (January 2018 ENCS),
// Annual Income Tax Return for Corporations, Partnerships and Other Non-Individual
// Taxpayers Subject Only to the REGULAR Income Tax Rate. Mirrors the official
// printed layout page-for-page:
//   Page 1 — Part I Background, Part II Total Tax Payable, signatories, Part III.
//   Page 2 — Part IV Computation of Tax, Part V Tax Relief Availment.
//   Page 3 — Part VI Schedule I (ordinary deductions), Schedule II (special).
//   Page 4 — Schedule III/IIIA (NOLCO), Schedule IV (MCIT), Schedule V (recon).
//
// Engine-computed summary lines are read-only; the editable inputs are the
// detailed schedule entries. Field keys match build1702RT + Guided1702RT.

import { createContext, useContext, type ReactNode } from "react";
import type { Comp1702RT } from "../../lib/compute";
import type { FormProps } from "../formProps";
import type { FilingData } from "../../types";
import { num } from "../../lib/format";
import { BirHeader, PartBand, PaymentDetails } from "../formparts";
import { BirAmt, BirBoxes, BirCkRow, BirText, BirVal, type SetFn } from "../formkit";

function fmtIncDate(iso?: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return m + "/" + d + "/" + y;
}

// Schedule I — ordinary allowable itemized deduction categories (items 1-16).
const SCHED1: string[] = [
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
interface Ctx1702RT {
  data: FilingData;
  set: SetFn;
}
const FormCtx = createContext<Ctx1702RT | null>(null);
const useF = () => useContext(FormCtx) as Ctx1702RT;

// ── single-amount row: number | label | one amount cell ──
function L1({
  no,
  label,
  sub,
  field,
  ro,
  value,
  strong,
  bg,
  dim,
  indent,
}: {
  no?: ReactNode;
  label: ReactNode;
  sub?: string;
  field?: string;
  ro?: boolean;
  value?: number;
  strong?: boolean;
  bg?: boolean;
  dim?: boolean;
  indent?: boolean;
}) {
  const { data, set } = useF();
  return (
    <div className="bir-line bt" style={bg ? { background: "var(--shade2)" } : undefined}>
      <div className="num">{no}</div>
      <div
        className="desc"
        style={{ fontWeight: strong ? 700 : 400, opacity: dim ? 0.5 : 1, paddingLeft: indent ? 16 : undefined }}
      >
        {label}
        {sub && <small> {sub}</small>}
      </div>
      <div className="amtcell bl br" style={{ width: 220 }}>
        <BirAmt field={field} data={data} set={set} ro={ro} value={value} dim={dim} />
      </div>
    </div>
  );
}

// ── italic sub-header line (e.g. "Less: Deductions Allowable under Existing Law") ──
function SubHead({ children }: { children: ReactNode }) {
  return (
    <div className="bir-line bt">
      <div className="num"></div>
      <div className="desc" style={{ fontStyle: "italic", fontWeight: 700 }}>
        {children}
      </div>
      <div className="amtcell bl br" style={{ width: 220 }}></div>
    </div>
  );
}

// ── light schedule sub-band ──
function SchedBand({ children }: { children: ReactNode }) {
  return (
    <div className="bir-section b" style={{ borderTop: 0 }}>
      {children}
    </div>
  );
}

// ── TIN + Registered Name strip for pages 2-4 ──
function TinNameBand({ tin, name }: { tin: string; name: string }) {
  return (
    <div className="row b" style={{ borderTop: 0 }}>
      <div className="bir-cell inline br grow">
        <span className="lblgrp">
          <span className="bir-cap">TIN</span>
        </span>
        <div className="fld">
          <BirBoxes value={tin} count={14} groups={[3, 3, 3, 5]} />
        </div>
      </div>
      <div className="bir-cell inline grow">
        <span className="lblgrp">
          <span className="bir-cap">Registered Name</span>
        </span>
        <div className="fld">
          <BirVal value={name} />
        </div>
      </div>
    </div>
  );
}

// ── Schedule II special-deduction row: Description | Legal Basis | Amount ──
function SpecialRow({ no }: { no: string }) {
  const { data, set } = useF();
  return (
    <div className="row b" style={{ borderTop: 0 }}>
      <div className="num" style={{ width: 28, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
        {no}
      </div>
      <div className="grow br" style={{ display: "flex", alignItems: "center" }}>
        <BirText field={`s2_${no}desc`} data={data} set={set} />
      </div>
      <div style={{ width: 240, display: "flex", alignItems: "center" }} className="br bl">
        <BirText field={`s2_${no}legal`} data={data} set={set} />
      </div>
      <div style={{ width: 160, display: "flex", alignItems: "center" }}>
        <BirAmt field={`s2_${no}amt`} data={data} set={set} />
      </div>
    </div>
  );
}

// ── Schedule IIIA — Available NOLCO table (Year + cols A-E) ──
function NolcoTable({ rows }: { rows: number[] }) {
  const { data, set } = useF();
  const col = { padding: "3px 4px" } as const;
  return (
    <>
      <div
        className="row b"
        style={{ borderTop: 0, background: "var(--shade2)", fontSize: 8.6, fontWeight: 700, textAlign: "center" }}
      >
        <div style={{ width: 86, ...col }} className="br">
          Year Incurred
        </div>
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
          <div className="grow">
            <BirAmt
              ro
              value={num(data[`nolco${r}A`]) - (num(data[`nolco${r}B`]) + num(data[`nolco${r}C`]) + num(data[`nolco${r}D`]))}
            />
          </div>
        </div>
      ))}
    </>
  );
}

// ── Schedule IV — Excess MCIT table (Year + cols A-G) ──
function McitTable({ rows }: { rows: number[] }) {
  const { data, set } = useF();
  const col = { padding: "3px 4px" } as const;
  return (
    <>
      <div
        className="row b"
        style={{ borderTop: 0, background: "var(--shade2)", fontSize: 8.6, fontWeight: 700, textAlign: "center" }}
      >
        <div style={{ width: 70, ...col }} className="br">Year</div>
        <div className="grow br" style={col}>A. Normal Income Tax as Adjusted</div>
        <div className="grow br" style={col}>B. MCIT</div>
        <div className="grow br" style={col}>C. Excess MCIT over Normal Income Tax</div>
        <div className="grow br" style={col}>D. Excess MCIT Applied/Used in Previous Years</div>
        <div className="grow br" style={col}>E. Expired Portion of Excess MCIT</div>
        <div className="grow br" style={col}>F. Excess MCIT Applied this Current Taxable Year</div>
        <div className="grow" style={col}>G. Balance Allowable as Tax Credit [G = C − (D+E+F)]</div>
      </div>
      {rows.map((r) => (
        <div className="row b" style={{ borderTop: 0 }} key={"mcit" + r}>
          <div style={{ width: 70, display: "flex", alignItems: "center" }} className="br">
            <span className="num" style={{ width: 18, flex: "none" }}>{r}</span>
            <BirText field={`mcit${r}Year`} data={data} set={set} lower />
          </div>
          <div className="grow br"><BirAmt field={`mcit${r}A`} data={data} set={set} /></div>
          <div className="grow br"><BirAmt field={`mcit${r}B`} data={data} set={set} /></div>
          <div className="grow br"><BirAmt field={`mcit${r}C`} data={data} set={set} /></div>
          <div className="grow br"><BirAmt field={`mcit${r}D`} data={data} set={set} /></div>
          <div className="grow br"><BirAmt field={`mcit${r}E`} data={data} set={set} /></div>
          <div className="grow br"><BirAmt field={`mcit${r}F`} data={data} set={set} /></div>
          <div className="grow">
            <BirAmt
              ro
              value={
                num(data[`mcit${r}C`]) -
                (num(data[`mcit${r}D`]) + num(data[`mcit${r}E`]) + num(data[`mcit${r}F`]))
              }
            />
          </div>
        </div>
      ))}
    </>
  );
}

export function Form1702RT({ tp, data, set, comp }: FormProps<Comp1702RT>) {
  const pick = (f: string, v: string) => set(f, data[f] === v ? "" : v);
  const is = (f: string, v: string) => data[f] === v;
  const regName = tp
    ? tp.kind === "individual"
      ? [tp.lastName, tp.firstName].filter(Boolean).join(", ")
      : tp.regName
    : "";
  const tin = (tp && tp.tin) || "";
  const incDate = tp && tp.incorpDate ? fmtIncDate(tp.incorpDate) : "";

  return (
    <FormCtx.Provider value={{ data, set }}>
      {/* ============================ PAGE 1 ============================ */}
      <div className="bir-sheet">
        <BirHeader
          code="1702-RT"
          date="January 2018 (ENCS)"
          page="1"
          title="Annual Income Tax Return"
          sub="Corporation, Partnership & Other Non-Individual Taxpayer — Subject Only to REGULAR Income Tax Rate"
          pcode="1702-RT 01/18 ENCS P1"
        />
        <div className="bir-instr bb b" style={{ borderTop: 0 }}>
          Enter all required information in CAPITAL LETTERS. Mark applicable boxes with an &ldquo;X&rdquo;. Two copies MUST
          be filed with the BIR and one held by the taxpayer.
        </div>

        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br" style={{ width: 200 }}>
            <span className="lblgrp">
              <span className="bir-ino">1</span> <span className="bir-cap">For</span>
            </span>
            <div className="fld" style={{ gap: 10 }}>
              <BirCkRow on={is("periodType", "calendar")} onClick={() => pick("periodType", "calendar")}>
                Calendar
              </BirCkRow>
              <BirCkRow on={is("periodType", "fiscal")} onClick={() => pick("periodType", "fiscal")}>
                Fiscal
              </BirCkRow>
            </div>
          </div>
          <div className="bir-cell inline br" style={{ width: 220 }}>
            <span className="lblgrp">
              <span className="bir-ino">2</span> <span className="bir-cap">Year Ended (MM/YYYY)</span>
            </span>
            <div className="fld">
              <BirText field="year" data={data} set={set} placeholder="2024" />
            </div>
          </div>
          <div className="bir-cell inline br grow">
            <span className="lblgrp">
              <span className="bir-ino">3</span> <span className="bir-cap">Amended?</span>
            </span>
            <div className="fld" style={{ gap: 10 }}>
              <BirCkRow on={is("amended", "yes")} onClick={() => pick("amended", "yes")}>
                Yes
              </BirCkRow>
              <BirCkRow on={is("amended", "no")} onClick={() => pick("amended", "no")}>
                No
              </BirCkRow>
            </div>
          </div>
          <div className="bir-cell inline" style={{ width: 200 }}>
            <span className="lblgrp">
              <span className="bir-ino">4</span> <span className="bir-cap">Short Period?</span>
            </span>
            <div className="fld" style={{ gap: 10 }}>
              <BirCkRow on={is("shortPeriod", "yes")} onClick={() => pick("shortPeriod", "yes")}>
                Yes
              </BirCkRow>
              <BirCkRow on={is("shortPeriod", "no")} onClick={() => pick("shortPeriod", "no")}>
                No
              </BirCkRow>
            </div>
          </div>
        </div>

        {/* 5 Alphanumeric Tax Code (ATC) */}
        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp">
            <span className="bir-ino">5</span> <span className="bir-cap">Alphanumeric Tax Code (ATC)</span>
          </span>
          <div className="fld" style={{ gap: 8 }}>
            <BirText field="atc" data={data} set={set} placeholder="IC 055" />
            <span style={{ fontSize: 9.6, color: "#555" }}>
              e.g. IC 055 — Minimum Corporate Income Tax (MCIT).
            </span>
          </div>
        </div>

        <PartBand>Part I – Background Information</PartBand>
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell br" style={{ width: 360 }}>
            <span className="bir-ino">6</span> <span className="bir-cap">TIN</span>
            <div style={{ marginTop: 3 }}>
              <BirBoxes value={tin} count={14} groups={[3, 3, 3, 5]} />
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
            <span className="bir-ino">8</span> <span className="bir-cap">Registered Name</span>
          </span>
          <div className="fld">
            <BirVal value={regName} />
          </div>
        </div>
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br grow">
            <span className="lblgrp">
              <span className="bir-ino">9</span> <span className="bir-cap">Registered Address</span>
            </span>
            <div className="fld">
              <BirVal value={tp ? [tp.address, tp.city].filter(Boolean).join(", ") : ""} fit />
            </div>
          </div>
          <div className="bir-cell inline" style={{ flex: "0 0 150px" }}>
            <span className="lblgrp">
              <span className="bir-ino">9A</span> <span className="bir-cap">ZIP</span>
            </span>
            <div className="fld">
              <BirVal value={tp?.zip} />
            </div>
          </div>
        </div>
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br" style={{ width: 340 }}>
            <span className="lblgrp">
              <span className="bir-ino">10</span> <span className="bir-cap">Date of Incorporation/Organization</span>
            </span>
            <div className="fld">
              <BirVal value={incDate} />
            </div>
          </div>
          <div className="bir-cell inline br" style={{ width: 250 }}>
            <span className="lblgrp">
              <span className="bir-ino">11</span> <span className="bir-cap">Contact Number</span>
            </span>
            <div className="fld">
              <BirVal value={tp?.phone} lower />
            </div>
          </div>
          <div className="bir-cell inline grow">
            <span className="lblgrp">
              <span className="bir-ino">12</span> <span className="bir-cap">Email</span>
            </span>
            <div className="fld">
              <BirVal value={tp?.email} lower />
            </div>
          </div>
        </div>
        <div className="bir-cell inline b" style={{ borderTop: 0 }}>
          <span className="lblgrp">
            <span className="bir-ino">13</span> <span className="bir-cap">Method of Deductions</span>
          </span>
          <div className="fld" style={{ gap: 16 }}>
            <BirCkRow on={is("method", "itemized")} onClick={() => pick("method", "itemized")}>
              Itemized Deductions [Sec. 34(A-J), NIRC]
            </BirCkRow>
            <BirCkRow on={is("method", "osd")} onClick={() => pick("method", "osd")}>
              Optional Standard Deduction (OSD) — 40% of Gross Income [Sec. 34(L), NIRC]
            </BirCkRow>
          </div>
        </div>
        {/* Tax relief under Special Law / International Tax Treaty */}
        <div className="row b" style={{ borderTop: 0 }}>
          <div className="bir-cell inline br" style={{ width: 460 }}>
            <span className="lblgrp">
              <span className="bir-cap">Are you availing of tax relief under Special Law/International Tax Treaty?</span>
            </span>
            <div className="fld" style={{ gap: 10 }}>
              <BirCkRow on={is("treaty", "yes")} onClick={() => pick("treaty", "yes")}>
                Yes
              </BirCkRow>
              <BirCkRow on={is("treaty", "no")} onClick={() => pick("treaty", "no")}>
                No
              </BirCkRow>
            </div>
          </div>
          <div className="bir-cell inline grow">
            <span className="lblgrp">
              <span className="bir-cap">If yes, specify</span>
            </span>
            <div className="fld">
              <BirText field="treatySpecify" data={data} set={set} />
            </div>
          </div>
        </div>

        <PartBand sub="(DO NOT enter Centavos; 49 Centavos or Less drop down; 50 or more round up)">
          Part II – Total Tax Payable
        </PartBand>
        <div className="b" style={{ borderTop: 0 }}>
          <L1 no="14" label="Tax Due (From Part IV Item 43)" ro value={comp.i14} strong />
          <L1 no="15" label="Less: Total Tax Credits/Payments (From Part IV Item 55)" ro value={comp.i15} />
          <L1 no="16" label="Net Tax Payable / (Overpayment) (Item 14 Less 15) (From Part IV Item 56)" ro value={comp.i16} strong />
          <SubHead>Add: Penalties</SubHead>
          <L1 no="17" label="Surcharge" field="i17" indent />
          <L1 no="18" label="Interest" field="i18" indent />
          <L1 no="19" label="Compromise" field="i19" indent />
          <L1 no="20" label="Total Penalties (Sum of Items 17 to 19)" ro value={comp.i20} strong />
          <L1
            no="21"
            label="TOTAL AMOUNT PAYABLE / (Overpayment) (Sum of Items 16 and 20)"
            ro
            value={comp.i21}
            strong
            bg
          />
        </div>

        <div className="bir-cell b" style={{ borderTop: 0 }}>
          <span className="bir-capi">
            If overpayment, mark one (1) box only. (Once the choice is made, the same is irrevocable)
          </span>
          <div className="row" style={{ gap: 20, marginTop: 3 }}>
            <BirCkRow on={is("over", "refund")} onClick={() => pick("over", "refund")}>
              To be refunded
            </BirCkRow>
            <BirCkRow on={is("over", "tcc")} onClick={() => pick("over", "tcc")}>
              To be issued a Tax Credit Certificate (TCC)
            </BirCkRow>
            <BirCkRow on={is("over", "carry")} onClick={() => pick("over", "carry")}>
              To be carried over as tax credit for next year/quarter
            </BirCkRow>
          </div>
        </div>

        {/* perjury declaration + two signatories */}
        <div className="b" style={{ borderTop: 0 }}>
          <div className="bir-perjury bb">
            We declare under the penalties of perjury that this return, and all its attachments, have been made in good
            faith, verified by us, and to the best of our knowledge and belief, are true and correct, pursuant to the
            provisions of the National Internal Revenue Code, as amended, and the regulations issued under authority
            thereof. (If signed by an Authorized Representative, indicate TIN and attach authorization letter)
          </div>
          {/* 22 Number of Attachments */}
          <div className="bir-cell inline bb" style={{ borderTop: 0 }}>
            <span className="lblgrp">
              <span className="bir-ino">22</span> <span className="bir-cap">Number of Attachments</span>
            </span>
            <div className="fld" style={{ maxWidth: 120 }}>
              <BirText field="attachments" data={data} set={set} placeholder="0" />
            </div>
          </div>
          <div className="row">
            <div className="bir-sign br grow" style={{ padding: "18px 6px 4px" }}>
              <BirVal value={regName} />
              <div style={{ borderTop: "0.7px solid var(--ln)", marginTop: 3, paddingTop: 3 }}>
                Signature over Printed Name of President/Principal Officer/Authorized Representative
              </div>
              <div className="row" style={{ gap: 8, marginTop: 6 }}>
                <div className="bir-cell inline grow" style={{ borderTop: 0 }}>
                  <span className="bir-cap">Title of Signatory</span>
                  <div className="fld">
                    <BirText field="presTitle" data={data} set={set} />
                  </div>
                </div>
                <div className="bir-cell inline" style={{ width: 180, borderTop: 0 }}>
                  <span className="bir-cap">TIN</span>
                  <div className="fld">
                    <BirText field="presTin" data={data} set={set} lower />
                  </div>
                </div>
              </div>
            </div>
            <div className="bir-sign grow" style={{ padding: "18px 6px 4px" }}>
              <BirText field="treasurer" data={data} set={set} />
              <div style={{ borderTop: "0.7px solid var(--ln)", marginTop: 3, paddingTop: 3 }}>
                Signature over Printed Name of Treasurer/Assistant Treasurer
              </div>
              <div className="row" style={{ gap: 8, marginTop: 6 }}>
                <div className="bir-cell inline grow" style={{ borderTop: 0 }}>
                  <span className="bir-cap">Title of Signatory</span>
                  <div className="fld">
                    <BirText field="treasTitle" data={data} set={set} />
                  </div>
                </div>
                <div className="bir-cell inline" style={{ width: 180, borderTop: 0 }}>
                  <span className="bir-cap">TIN</span>
                  <div className="fld">
                    <BirText field="treasTin" data={data} set={set} lower />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <PaymentDetails data={data} set={set} startNo={23} />
      </div>

      {/* ============================ PAGE 2 — Part IV / Part V ============================ */}
      <div className="bir-sheet" data-rate={comp.method}>
        <BirHeader
          code="1702-RT"
          date="January 2018 (ENCS)"
          page="2"
          title="Annual Income Tax Return"
          sub="Corporation, Partnership & Other Non-Individual — Regular Income Tax Rate"
          pcode="1702-RT 01/18 ENCS P2"
        />
        <TinNameBand tin={tin} name={regName} />

        <PartBand sub="(DO NOT enter Centavos; 49 Centavos or Less drop down; 50 or more round up)">
          Part IV – Computation of Tax
        </PartBand>
        <div className="b" style={{ borderTop: 0 }}>
          <L1 no="27" label="Sales/Receipts/Revenues/Fees" field="i27" />
          <L1 no="28" label="Less: Sales Returns, Allowances and Discounts" field="i28" />
          <L1 no="29" label="Net Sales/Receipts (Item 27 Less 28)" ro value={comp.i29} />
          <L1 no="30" label="Less: Cost of Sales/Services" field="i30" />
          <L1 no="31" label="Gross Income from Operation (Item 29 Less 30)" ro value={comp.i31} strong />
          <L1 no="32" label="Add: Other Taxable Income Not Subjected to Final Tax" field="i32" />
          <L1 no="33" label="Total Taxable Income (Sum of Items 31 and 32)" ro value={comp.i33} strong />
          <SubHead>Less: Deductions Allowable under Existing Law</SubHead>
          <L1
            no="34"
            label="Ordinary Allowable Itemized Deductions (From Part VI Schedule I Item 18)"
            ro
            value={comp.i34}
            dim={comp.method === "osd"}
          />
          <L1
            no="35"
            label="Special Allowable Itemized Deductions (From Part VI Schedule II Item 5)"
            ro
            value={comp.i35}
            dim={comp.method === "osd"}
          />
          <L1
            no="36"
            label="NOLCO (From Part VI Schedule III Item 8) [only for those taxable under Sec. 27/28]"
            ro
            value={comp.i36}
            dim={comp.method === "osd"}
          />
          <L1 no="37" label="Total Deductions (Sum of Items 34 to 36)" ro value={comp.i37} strong dim={comp.method === "osd"} />
          <L1
            no="38"
            label="OR: Optional Standard Deduction (OSD) — 40% of Item 33"
            ro
            value={comp.i38}
            strong
            dim={comp.method !== "osd"}
          />
          <L1 no="39" label="Net Taxable Income/(Loss) (Itemized: 33−37; OSD: 33−38)" ro value={comp.i39} strong />
          <div className="bir-line bt">
            <div className="num">40</div>
            <div className="desc">Applicable Income Tax Rate</div>
            <div
              className="amtcell bl br"
              style={{ width: 220, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2, paddingRight: 6 }}
            >
              <input
                className="bir-rate"
                inputMode="decimal"
                value={data.rate == null ? "25" : (data.rate as string)}
                onChange={(e) => set("rate", e.target.value.replace(/[^0-9.]/g, ""))}
              />
              <span style={{ fontSize: 11, color: "#555" }}>%</span>
            </div>
          </div>
          <L1 no="41" label="Income Tax Due other than MCIT (Item 39 × Item 40)" ro value={comp.i41} />
          <L1 no="42" label="MCIT Due (2% of Item 33)" ro value={comp.i42} />
          <L1 no="43" label="Tax Due (higher of Item 41 or 42) (To Part II Item 14)" ro value={comp.i43} strong bg />
          <SubHead>Less: Tax Credits/Payments (attach proof)</SubHead>
          <L1 no="44" label="Prior Year’s Excess Credits other than MCIT" field="i44" />
          <L1 no="45" label="Income Tax Payment under MCIT from Previous Quarter/s" field="i45" />
          <L1 no="46" label="Income Tax Payment under Regular/Normal Rate from Previous Quarter/s" field="i46" />
          <L1 no="47" label="Excess MCIT Applied this Current Taxable Year (From Part VI Schedule IV Item 4)" ro value={comp.i47} />
          <L1 no="48" label="Creditable Tax Withheld from Previous Quarter/s (BIR Form 2307)" field="i48" />
          <L1 no="49" label="Creditable Tax Withheld per BIR Form 2307 for the 4th Quarter" field="i49" />
          <L1 no="50" label="Foreign Tax Credits, if applicable" field="i50" />
          <L1 no="51" label="Tax Paid in Return Previously Filed, if this is an Amended Return" field="i51" />
          <L1 no="52" label="Special Tax Credits (To Part V Item 58)" field="i52" />
          <SubHead>Other Tax Credits/Payments (specify)</SubHead>
          <div className="bir-line bt">
            <div className="num">53</div>
            <div className="desc">
              <BirText field="i53desc" data={data} set={set} placeholder="(specify)" />
            </div>
            <div className="amtcell bl br" style={{ width: 220 }}>
              <BirAmt field="i53" data={data} set={set} />
            </div>
          </div>
          <div className="bir-line bt">
            <div className="num">54</div>
            <div className="desc">
              <BirText field="i54desc" data={data} set={set} placeholder="(specify)" />
            </div>
            <div className="amtcell bl br" style={{ width: 220 }}>
              <BirAmt field="i54" data={data} set={set} />
            </div>
          </div>
          <L1 no="55" label="Total Tax Credits/Payments (Sum of Items 44 to 54) (To Part II Item 15)" ro value={comp.i55} strong />
          <L1 no="56" label="Net Tax Payable / (Overpayment) (Item 43 Less 55) (To Part II Item 16)" ro value={comp.i56} strong bg />
        </div>

        <PartBand>Part V – Tax Relief Availment</PartBand>
        <div className="b" style={{ borderTop: 0 }}>
          <L1 no="57" label="Special Allowable Itemized Deductions (Item 35 of Part IV × Applicable Income Tax Rate)" ro value={comp.i57} />
          <L1 no="58" label="Add: Special Tax Credits (From Part IV Item 52)" ro value={comp.i58} />
          <L1 no="59" label="Total Tax Relief Availment (Sum of Items 57 and 58)" ro value={comp.i59} strong />
        </div>

        {comp.mcitApplies && (
          <div
            style={{
              marginTop: 6,
              fontSize: 10,
              color: "#b07a2e",
              background: "#fdf6ec",
              border: "1px solid #f0dcae",
              borderRadius: 6,
              padding: "6px 10px",
            }}
          >
            ⚠ MCIT (2% of gross income) exceeds the normal income tax — the MCIT amount is used as the Tax Due (Item 43).
          </div>
        )}
        <div style={{ marginTop: 6, fontSize: 10, color: "#555" }}>
          Regular corporate rate is <b>25%</b> (or <b>20%</b> if net taxable income ≤ ₱5M and total assets ≤ ₱100M,
          excluding land). Tax due is the higher of the normal tax or the 2% MCIT.
        </div>
      </div>

      {/* ============================ PAGE 3 — Schedule I / II ============================ */}
      <div className="bir-sheet">
        <BirHeader
          code="1702-RT"
          date="January 2018 (ENCS)"
          page="3"
          title="Annual Income Tax Return"
          sub="Corporation, Partnership & Other Non-Individual — Regular Income Tax Rate"
          pcode="1702-RT 01/18 ENCS P3"
        />
        <TinNameBand tin={tin} name={regName} />

        <PartBand sub="(DO NOT enter Centavos; 49 Centavos or Less drop down; 50 or more round up)">
          Part VI – Schedules
        </PartBand>

        {/* Schedule I — Ordinary Allowable Itemized Deductions */}
        <SchedBand>Schedule I – Ordinary Allowable Itemized Deductions (attach additional sheet/s, if necessary)</SchedBand>
        <div className="b" style={{ borderTop: 0 }}>
          {SCHED1.map((lbl, i) => (
            <L1 key={"s1_" + (i + 1)} no={String(i + 1)} label={lbl} field={`s1_${i + 1}`} />
          ))}
          <SubHead>17 Others (Deductions Subject to Withholding Tax and Other Expenses)</SubHead>
          <L1 no="17a" label="Janitorial and Messengerial Services" field="s1_17a" indent />
          <L1 no="17b" label="Professional Fees" field="s1_17b" indent />
          <L1 no="17c" label="Security Services" field="s1_17c" indent />
          {["d", "e", "f", "g", "h", "i"].map((r) => (
            <div className="bir-line bt" key={"s1_17" + r}>
              <div className="num">{"17" + r}</div>
              <div className="desc" style={{ paddingLeft: 16 }}>
                <BirText field={`s1_17${r}desc`} data={data} set={set} placeholder="(specify)" />
              </div>
              <div className="amtcell bl br" style={{ width: 220 }}>
                <BirAmt field={`s1_17${r}`} data={data} set={set} />
              </div>
            </div>
          ))}
          <L1
            no="18"
            label="Total Ordinary Allowable Itemized Deductions (Sum of Items 1 to 17i) (To Part IV Item 34)"
            ro
            value={comp.sch1Total}
            strong
            bg
          />
        </div>

        {/* Schedule II — Special Allowable Itemized Deductions */}
        <SchedBand>Schedule II – Special Allowable Itemized Deductions (attach additional sheet/s, if necessary)</SchedBand>
        <div className="row b" style={{ borderTop: 0, background: "var(--shade2)", fontSize: 9.6, fontWeight: 700 }}>
          <div className="num" style={{ width: 28 }}></div>
          <div className="grow br" style={{ padding: "3px 5px" }}>Description</div>
          <div style={{ width: 240, padding: "3px 5px" }} className="br bl">Legal Basis</div>
          <div style={{ width: 160, padding: "3px 5px", textAlign: "center" }}>Amount</div>
        </div>
        <SpecialRow no="1" />
        <SpecialRow no="2" />
        <SpecialRow no="3" />
        <SpecialRow no="4" />
        <L1
          no="5"
          label="Total Special Allowable Itemized Deductions (Sum of Items 1 to 4) (To Part IV Item 35)"
          ro
          value={comp.sch2Total}
          strong
          bg
        />
      </div>

      {/* ============================ PAGE 4 — Schedule III / IV / V ============================ */}
      <div className="bir-sheet">
        <BirHeader
          code="1702-RT"
          date="January 2018 (ENCS)"
          page="4"
          title="Annual Income Tax Return"
          sub="Corporation, Partnership & Other Non-Individual — Regular Income Tax Rate"
          pcode="1702-RT 01/18 ENCS P4"
        />
        <TinNameBand tin={tin} name={regName} />

        {/* Schedule III — NOLCO computation */}
        <SchedBand>Schedule III – Computation of Net Operating Loss Carry Over (NOLCO)</SchedBand>
        <div className="b" style={{ borderTop: 0 }}>
          <L1 no="1" label="Gross Income (From Part IV Item 33)" ro value={comp.i33} />
          <L1 no="2" label="Less: Ordinary Allowable Itemized Deductions (From Part VI Schedule I Item 18)" ro value={comp.i34} />
          <L1 no="3" label="Net Operating Loss (Item 1 Less Item 2) (To Schedule IIIA, Item 7A)" ro value={comp.sch3NetLoss} strong />
        </div>

        <SchedBand>Schedule IIIA – Computation of Available Net Operating Loss Carry Over (NOLCO)</SchedBand>
        <NolcoTable rows={[4, 5, 6, 7]} />
        <L1 no="8" label="Total NOLCO (Sum of Items 4D to 7D) (To Part IV Item 36)" ro value={comp.sch3aTotal} strong bg />

        {/* Schedule IV — MCIT computation */}
        <SchedBand>Schedule IV – Computation of Minimum Corporate Income Tax (MCIT)</SchedBand>
        <McitTable rows={[1, 2, 3]} />
        <L1 no="4" label="Total Excess MCIT Applied (Sum of Items 1F to 3F) (To Part IV Item 47)" ro value={comp.sch4Total} strong bg />

        {/* Schedule V — Reconciliation of net income per books */}
        <SchedBand>Schedule V – Reconciliation of Net Income per Books Against Taxable Income</SchedBand>
        <div className="b" style={{ borderTop: 0 }}>
          <L1 no="1" label="Net Income/(Loss) per Books" field="schV1" />
          <SubHead>Add: Non-Deductible Expenses/Taxable Other Income</SubHead>
          <div className="bir-line bt">
            <div className="num">2</div>
            <div className="desc" style={{ paddingLeft: 16 }}>
              <BirText field="schV2desc" data={data} set={set} placeholder="(specify)" />
            </div>
            <div className="amtcell bl br" style={{ width: 220 }}>
              <BirAmt field="schV2" data={data} set={set} />
            </div>
          </div>
          <div className="bir-line bt">
            <div className="num">3</div>
            <div className="desc" style={{ paddingLeft: 16 }}>
              <BirText field="schV3desc" data={data} set={set} placeholder="(specify)" />
            </div>
            <div className="amtcell bl br" style={{ width: 220 }}>
              <BirAmt field="schV3" data={data} set={set} />
            </div>
          </div>
          <L1 no="4" label="Total (Sum of Items 1 to 3)" ro value={comp.schV4} strong />
          <SubHead>Less: A) Non-Taxable Income and Income Subjected to Final Tax</SubHead>
          <div className="bir-line bt">
            <div className="num">5</div>
            <div className="desc" style={{ paddingLeft: 16 }}>
              <BirText field="schV5desc" data={data} set={set} placeholder="(specify)" />
            </div>
            <div className="amtcell bl br" style={{ width: 220 }}>
              <BirAmt field="schV5" data={data} set={set} />
            </div>
          </div>
          <div className="bir-line bt">
            <div className="num">6</div>
            <div className="desc" style={{ paddingLeft: 16 }}>
              <BirText field="schV6desc" data={data} set={set} placeholder="(specify)" />
            </div>
            <div className="amtcell bl br" style={{ width: 220 }}>
              <BirAmt field="schV6" data={data} set={set} />
            </div>
          </div>
          <SubHead>B) Special Deductions</SubHead>
          <div className="bir-line bt">
            <div className="num">7</div>
            <div className="desc" style={{ paddingLeft: 16 }}>
              <BirText field="schV7desc" data={data} set={set} placeholder="(specify)" />
            </div>
            <div className="amtcell bl br" style={{ width: 220 }}>
              <BirAmt field="schV7" data={data} set={set} />
            </div>
          </div>
          <div className="bir-line bt">
            <div className="num">8</div>
            <div className="desc" style={{ paddingLeft: 16 }}>
              <BirText field="schV8desc" data={data} set={set} placeholder="(specify)" />
            </div>
            <div className="amtcell bl br" style={{ width: 220 }}>
              <BirAmt field="schV8" data={data} set={set} />
            </div>
          </div>
          <L1 no="9" label="Total (Sum of Items 5 to 8)" ro value={comp.schV9} strong />
          <L1 no="10" label="Net Taxable Income/(Loss) (Item 4 Less Item 9)" ro value={comp.schV10} strong bg />
        </div>
      </div>
    </FormCtx.Provider>
  );
}

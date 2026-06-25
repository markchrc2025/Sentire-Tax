// bir-compute2.jsx — computation engines for the remaining 6 forms
// Extends window.BIR with compute functions. Plain JS (loaded before babel files).

(function () {
  const B = window.BIR;
  const num = B.num, roundPeso = B.roundPeso, grad = B.graduatedTax;

  // ---------- 2307: Certificate of Creditable Tax Withheld ----------
  // rows: {atc, desc, m1, m2, m3, tax}. total per row = m1+m2+m3
  B.compute2307 = function (d) {
    const rows = d.rows || [];
    let tIncome = 0, tTax = 0, tM1 = 0, tM2 = 0, tM3 = 0;
    const out = rows.map((r) => {
      const m1 = num(r.m1), m2 = num(r.m2), m3 = num(r.m3);
      const total = m1 + m2 + m3;
      tIncome += total; tTax += num(r.tax); tM1 += m1; tM2 += m2; tM3 += m3;
      return { total };
    });
    return { rows: out, totalIncome: tIncome, totalTax: tTax, tM1, tM2, tM3 };
  };

  // ---------- 2316: Certificate of Compensation ----------
  B.compute2316 = function (d) {
    const o = {};
    // Non-taxable (29-37) -> 38
    o.i38 = [29, 30, 31, 32, 33, 34, 35, 36, 37].reduce((s, n) => s + num(d["i" + n]), 0);
    // Taxable regular (39-50) + supplementary (51,51A,51B) -> 26
    const reg = [39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50].reduce((s, n) => s + num(d["i" + n]), 0);
    const supp = num(d.i51) + num(d.i51A) + num(d.i51B);
    o.reg = reg; o.supp = supp;
    o.i26 = reg + supp;                         // total taxable comp present
    o.i52 = o.i26;                              // = item 52 (gross taxable from present)
    o.i19 = o.i38 + o.i52;                      // gross comp income present
    o.i20 = o.i38;                              // less non-taxable
    o.i21 = o.i19 - o.i20;                      // taxable comp present
    o.i22 = num(d.i22);                         // add previous employer
    o.i23 = o.i21 + o.i22;                      // gross taxable comp
    o.i24 = roundPeso(grad(o.i23, (d.year || "").slice(0, 4)));  // tax due
    o.i25A = num(d.i25A); o.i25B = num(d.i25B);
    o.i25 = o.i25A + o.i25B;                    // adjusted taxes withheld (=52 area)
    o.i27 = num(d.i27);                         // PERA 5% credit
    o.i28 = o.i25 + o.i27;                      // total taxes withheld
    return o;
  };

  // ---------- 2551Q: Quarterly Percentage Tax ----------
  B.compute2551Q = function (d) {
    const rows = d.rows || [];
    let totalDue = 0;
    const out = rows.map((r) => {
      const taxable = num(r.taxable), rate = num(r.rate);
      const due = roundPeso(taxable * rate / 100);
      totalDue += due;
      return { due };
    });
    const o = { rows: out };
    o.i14 = totalDue;                           // total tax due
    o.i15 = num(d.i15); o.i16 = num(d.i16); o.i17 = num(d.i17);
    o.i18 = o.i15 + o.i16 + o.i17;              // total credits
    o.i19 = o.i14 - o.i18;                      // tax still payable
    o.i20 = num(d.i20); o.i21 = num(d.i21); o.i22 = num(d.i22);
    o.i23 = o.i20 + o.i21 + o.i22;              // total penalties
    o.i24 = o.i19 + o.i23;                      // total amount payable
    return o;
  };

  // ---------- 2550Q: Quarterly VAT (full Part IV line flow) ----------
  B.compute2550Q = function (d) {
    const o = {};
    // Output side
    o.i31a = num(d.i31a);
    o.i31b = roundPeso(o.i31a * 0.12);          // output tax 12%
    o.i32a = num(d.i32a); o.i33a = num(d.i33a);
    o.i34a = o.i31a + o.i32a + o.i33a;          // total sales
    o.i34b = o.i31b;                            // total output tax due
    o.i35b = num(d.i35b); o.i36b = num(d.i36b);
    o.i37 = o.i34b - o.i35b + o.i36b;           // adjusted output tax due

    // Input tax carried over block (38-42) -> 43
    o.i38 = num(d.i38); o.i39 = num(d.i39); o.i40 = num(d.i40);
    o.i41 = num(d.i41); o.i42 = num(d.i42);
    o.i43 = o.i38 + o.i39 + o.i40 + o.i41 + o.i42;

    // Current transactions (44-50)
    o.i44a = num(d.i44a); o.i44b = num(d.i44b);
    o.i45a = num(d.i45a); o.i45b = num(d.i45b);
    o.i46a = num(d.i46a); o.i46b = num(d.i46b);
    o.i47a = num(d.i47a); o.i47b = num(d.i47b);
    o.i48a = num(d.i48a); o.i49a = num(d.i49a);
    o.i50a = o.i44a + o.i45a + o.i46a + o.i47a + o.i48a + o.i49a;   // total current purchases
    o.i50b = o.i44b + o.i45b + o.i46b + o.i47b;                     // total current input tax
    o.i51 = o.i43 + o.i50b;                     // total available input tax

    // Deductions/adjustments (52-60)
    o.i52 = num(d.i52); o.i53 = num(d.i53); o.i54 = num(d.i54);
    o.i55 = num(d.i55); o.i56 = num(d.i56);
    o.i57 = o.i52 + o.i53 + o.i54 + o.i55 + o.i56;
    o.i58 = num(d.i58);
    o.i59 = o.i57 + o.i58;                       // adjusted deductions
    o.i60 = o.i51 - o.i59;                       // total allowable input tax
    o.i61 = o.i37 - o.i60;                       // net VAT payable (To Part II Item 15)
    o.inputTotal = o.i60;                        // backward-compat

    // Part II rollup
    o.i15 = o.i61;
    o.i16 = num(d.i16); o.i17 = num(d.i17); o.i18 = num(d.i18); o.i19 = num(d.i19);
    o.i20 = o.i16 + o.i17 + o.i18 + o.i19;      // total credits
    o.i21 = o.i15 - o.i20;                       // tax still payable
    o.i22 = num(d.i22); o.i23 = num(d.i23); o.i24 = num(d.i24);
    o.i25 = o.i22 + o.i23 + o.i24;              // penalties
    o.i26 = o.i21 + o.i25;                       // total payable
    return o;
  };

  // ---------- 1701Q: Quarterly ITR (individuals) ----------
  // method: 'itemized' | 'osd' ; rate: 'graduated' | 'eight'
  B.compute1701Q = function (d) {
    const year = (d.year || "").slice(0, 4);
    const out = { A: {}, B: {} };
    ["A", "B"].forEach((s) => {
      const o = out[s];
      // graduated schedule I
      o.sales = num(d["sales" + s]);
      o.returns = num(d["returns" + s]);
      o.netSales = o.sales - o.returns;
      o.cogs = num(d["cogs" + s]);
      o.gross = o.netSales - o.cogs;            // gross income
      o.method = d["method" + s] || "osd";
      o.deductions = o.method === "osd" ? roundPeso(o.netSales * 0.40) : num(d["deduct" + s]);
      o.netIncome = o.gross - o.deductions;
      o.otherInc = num(d["other" + s]);
      o.prevTaxable = num(d["prevTaxable" + s]);
      o.taxableThis = o.netIncome + o.otherInc;
      o.taxableCum = o.taxableThis + o.prevTaxable;
      o.gradTax = roundPeso(grad(o.taxableCum, year));
      // 8% schedule II
      o.gross8 = o.netSales + o.otherInc;
      o.prev8 = num(d["prev8" + s]);
      o.cum8 = o.gross8 + o.prev8;
      o.reduce8 = s === "A" ? 250000 : 0;
      o.taxable8 = Math.max(0, o.cum8 - o.reduce8);
      o.tax8 = roundPeso(o.taxable8 * 0.08);
      o.rate = d["rate" + s] || "graduated";
      o.taxDue = o.rate === "eight" ? o.tax8 : o.gradTax;
      // credits
      o.prevPaid = num(d["prevPaid" + s]);
      o.cwt = num(d["cwt" + s]);
      o.excess = num(d["excess" + s]);
      o.credits = o.prevPaid + o.cwt + o.excess;
      o.payable = o.taxDue - o.credits;
      o.penalties = num(d["pen" + s]);
      o.totalPayable = o.payable + o.penalties;
    });
    out.aggregate = out.A.totalPayable + out.B.totalPayable;
    return out;
  };

  // ---------- 1701: Annual ITR (mixed income) ----------
  B.compute1701 = function (d) {
    const year = (d.year || "").slice(0, 4);
    const out = { A: {}, B: {} };
    ["A", "B"].forEach((s) => {
      const o = out[s];
      o.comp = num(d["comp" + s]);              // taxable compensation income
      o.sales = num(d["sales" + s]);
      o.returns = num(d["returns" + s]);
      o.netSales = o.sales - o.returns;
      o.cogs = num(d["cogs" + s]);
      o.gross = o.netSales - o.cogs;
      o.method = d["method" + s] || "osd";
      o.deductions = o.method === "osd" ? roundPeso(o.netSales * 0.40) : num(d["deduct" + s]);
      o.netBiz = o.gross - o.deductions;
      o.otherInc = num(d["other" + s]);
      o.netBizTotal = o.netBiz + o.otherInc;
      o.rate = d["rate" + s] || "graduated";
      // 8% path: gross sales + other, less 250k
      o.gross8 = o.netSales + o.otherInc;
      o.taxable8 = Math.max(0, o.gross8 - (s === "A" ? 250000 : 0));
      o.tax8biz = roundPeso(o.taxable8 * 0.08);
      o.taxableTotal = o.rate === "eight"
        ? o.comp + o.taxable8
        : o.comp + o.netBizTotal;
      // tax due: 8% on biz + graduated on comp ; graduated on combined otherwise
      o.taxDue = o.rate === "eight"
        ? roundPeso(grad(o.comp, year)) + o.tax8biz
        : roundPeso(grad(o.comp + o.netBizTotal, year));
      o.prevPaid = num(d["prevPaid" + s]);
      o.cwt = num(d["cwt" + s]);
      o.excess = num(d["excess" + s]);
      o.taxWithheldComp = num(d["compCwt" + s]);
      o.credits = o.prevPaid + o.cwt + o.excess + o.taxWithheldComp;
      o.payable = o.taxDue - o.credits;
      o.installment = num(d["install" + s]);
      o.afterInstall = o.payable - o.installment;
      o.penalties = num(d["pen" + s]);
      o.totalPayable = o.afterInstall + o.penalties;
    });
    out.aggregate = out.A.totalPayable + out.B.totalPayable;
    return out;
  };

  // ---------- 1702-RT: Annual ITR, corporations — Regular Rate (MCIT-aware) ----------
  B.compute1702RT = function (d) {
    const o = {};
    const rate = d.rate == null || d.rate === "" ? 25 : num(d.rate);   // % regular/normal
    o.rate = rate;
    o.i27 = num(d.i27);                          // sales/receipts
    o.i28 = num(d.i28);                          // returns
    o.i29 = o.i27 - o.i28;                       // net sales
    o.i30 = num(d.i30);                          // cost of sales
    o.i31 = o.i29 - o.i30;                       // gross income from operation
    o.i32 = num(d.i32);                          // other taxable income
    o.i33 = o.i31 + o.i32;                       // total taxable income (gross)
    o.method = d.method || "itemized";
    o.i34 = num(d.i34); o.i35 = num(d.i35); o.i36 = num(d.i36);
    o.i37 = o.i34 + o.i35 + o.i36;               // total itemized deductions
    o.i38 = roundPeso(o.i33 * 0.40);             // OSD = 40% of gross income (item 33)
    o.i39 = o.method === "osd" ? o.i33 - o.i38 : o.i33 - o.i37;  // net taxable income
    o.i40 = rate;
    o.i41 = roundPeso(o.i39 * rate / 100);       // income tax due (normal)
    o.i42 = roundPeso(o.i33 * 0.02);             // MCIT 2% of gross income
    o.i43 = Math.max(o.i41, o.i42);              // tax due (higher)
    o.mcitApplies = o.i42 > o.i41;
    // credits 44-54
    o.i44 = num(d.i44); o.i45 = num(d.i45); o.i46 = num(d.i46); o.i47 = num(d.i47);
    o.i48 = num(d.i48); o.i49 = num(d.i49); o.i50 = num(d.i50); o.i51 = num(d.i51);
    o.i52 = num(d.i52); o.i53 = num(d.i53); o.i54 = num(d.i54);
    o.i55 = o.i44 + o.i45 + o.i46 + o.i47 + o.i48 + o.i49 + o.i50 + o.i51 + o.i52 + o.i53 + o.i54;
    o.i56 = o.i43 - o.i55;                        // net tax payable
    // Part II
    o.i14 = o.i43; o.i15 = o.i55; o.i16 = o.i56;
    o.i17 = num(d.i17); o.i18 = num(d.i18); o.i19 = num(d.i19);
    o.i20 = o.i17 + o.i18 + o.i19;               // penalties
    o.i21 = o.i16 + o.i20;                        // total amount payable
    return o;
  };

  // ---------- 1702Q: Quarterly ITR, corporations (MCIT-aware) ----------
  B.compute1702Q = function (d) {
    const o = {};
    const rate = d.rate == null || d.rate === "" ? 25 : num(d.rate);
    o.rate = rate;
    // Schedule 2 — Regular/Normal Rate
    o.s2_1 = num(d.s2_1);                         // sales
    o.s2_2 = num(d.s2_2);                         // cost of sales
    o.s2_3 = o.s2_1 - o.s2_2;                     // gross income from operation
    o.s2_4 = num(d.s2_4);                         // non-operating/other
    o.s2_5 = o.s2_3 + o.s2_4;                     // total gross income
    o.method = d.method || "itemized";
    o.s2_6 = o.method === "osd" ? roundPeso(o.s2_5 * 0.40) : num(d.s2_6);  // deductions
    o.s2_7 = o.s2_5 - o.s2_6;                     // taxable income this quarter
    o.s2_8 = num(d.s2_8);                         // taxable income previous quarters
    o.s2_9 = o.s2_7 + o.s2_8;                     // total taxable income to date
    o.s2_10 = rate;
    o.s2_11 = roundPeso(o.s2_9 * rate / 100);     // income tax due (normal)
    o.mcit = roundPeso(o.s2_5 * 0.02);            // MCIT 2% of gross income
    o.s2_13 = Math.max(o.s2_11, o.mcit);          // income tax due (higher)
    o.mcitApplies = o.mcit > o.s2_11;
    // Part II
    o.i14 = o.s2_13;
    o.i15 = num(d.i15);                           // less unexpired excess MCIT
    o.i16 = o.i14 - o.i15;                        // balance regular
    o.i17 = num(d.i17);                           // add special rate
    o.i18 = o.i16 + o.i17;                        // aggregate income tax due
    o.i19 = num(d.i19);                           // total credits/payments
    o.i20 = o.i18 - o.i19;                        // net tax payable
    o.i21 = num(d.i21); o.i22 = num(d.i22); o.i23 = num(d.i23);
    o.i24 = o.i21 + o.i22 + o.i23;               // penalties
    o.i25 = o.i20 + o.i24;                        // total amount payable
    return o;
  };

  // dispatch helper
  B.computeFor = function (form, data) {
    switch (form) {
      case "1701A": return B.compute1701A(data);
      case "1701": return B.compute1701(data);
      case "1701Q": return B.compute1701Q(data);
      case "1702RT": return B.compute1702RT(data);
      case "1702Q": return B.compute1702Q(data);
      case "2550Q": return B.compute2550Q(data);
      case "2551Q": return B.compute2551Q(data);
      case "2307": return B.compute2307(data);
      case "2316": return B.compute2316(data);
      default: return null;
    }
  };
})();

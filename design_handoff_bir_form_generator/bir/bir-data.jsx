// bir-data.jsx — Sentire BIR Form Generator · storage, taxpayer registry, tax engine
// Exports to window: BIR (namespace with store, compute, format helpers, catalog)

(function () {
  const LS_KEY = "sentire_bir_v2";

  // ---------- low-level store ----------
  function read() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }
  function blank() {
    return { taxpayers: {}, filings: {}, seq: 1 };
  }
  let DB = read() || seed();
  function persist() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(DB)); } catch (e) {}
  }
  function uid(prefix) {
    const n = DB.seq++; persist();
    return (prefix || "id") + "_" + Date.now().toString(36) + "_" + n;
  }

  // ---------- seed sample data (first run only) ----------
  function seed() {
    const db = blank();
    const t1 = "tp_seed_aurora";
    const t2 = "tp_seed_delacruz";
    db.taxpayers[t1] = {
      id: t1, kind: "non-individual",
      regName: "AURORA DIGITAL SOLUTIONS INC.",
      lastName: "", firstName: "", middleName: "",
      tin: "284-551-907", branch: "00000", rdo: "050",
      address: "Unit 12F, Cyberscape Beta, Topaz Road, Ortigas Center",
      city: "Pasig City", zip: "1605",
      birthdate: "", email: "tax@auroradigital.ph",
      phone: "02-8845-1190", citizenship: "Filipino",
      civilStatus: "", taxpayerType: "", rdoName: "RDO 050 - Pasig City",
      classification: "Small", createdAt: Date.now(),
    };
    db.taxpayers[t2] = {
      id: t2, kind: "individual",
      regName: "",
      lastName: "DELA CRUZ", firstName: "MARIA ISABEL", middleName: "SANTOS",
      tin: "192-845-663", branch: "00000", rdo: "039",
      address: "27 Magnolia Street, Barangay Sikatuna Village, Quezon City",
      city: "Quezon City", zip: "1101",
      birthdate: "1989-04-12", email: "maria.delacruz@gmail.com",
      phone: "0917-555-2841", citizenship: "Filipino",
      civilStatus: "Married", taxpayerType: "Professional",
      classification: "Micro", createdAt: Date.now(),
    };
    db.seq = 5;
    db._seeded = true;
    return db;
  }

  // ---------- taxpayers ----------
  const Taxpayers = {
    all() { return Object.values(DB.taxpayers).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); },
    get(id) { return DB.taxpayers[id] || null; },
    save(tp) {
      if (!tp.id) tp.id = uid("tp");
      if (!tp.createdAt) tp.createdAt = Date.now();
      tp.updatedAt = Date.now();
      DB.taxpayers[tp.id] = tp; persist();
      return tp;
    },
    remove(id) {
      delete DB.taxpayers[id];
      Object.values(DB.filings).forEach((f) => { if (f.taxpayerId === id) delete DB.filings[f.id]; });
      persist();
    },
    displayName(tp) {
      if (!tp) return "—";
      if (tp.kind === "individual") {
        return [tp.lastName, tp.firstName].filter(Boolean).join(", ") +
          (tp.middleName ? " " + tp.middleName : "");
      }
      return tp.regName || "—";
    },
  };

  // ---------- filings ----------
  const Filings = {
    all() { return Object.values(DB.filings).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)); },
    forTaxpayer(id) { return this.all().filter((f) => f.taxpayerId === id); },
    get(id) { return DB.filings[id] || null; },
    create(form, taxpayerId) {
      const f = {
        id: uid("flg"), form, taxpayerId,
        status: "draft", period: "", data: {},
        createdAt: Date.now(), updatedAt: Date.now(),
      };
      DB.filings[f.id] = f; persist();
      return f;
    },
    save(f) {
      f.updatedAt = Date.now();
      DB.filings[f.id] = f; persist();
      return f;
    },
    remove(id) { delete DB.filings[id]; persist(); },
  };

  // ---------- form catalog ----------
  const CATALOG = [
    { code: "1701", name: "Annual Income Tax Return", sub: "Individuals (mixed income / business)", cat: "Income Tax", ready: true },
    { code: "1701A", name: "Annual Income Tax Return", sub: "Individuals — purely business/profession", cat: "Income Tax", ready: true },
    { code: "1701Q", name: "Quarterly Income Tax Return", sub: "Individuals, estates & trusts", cat: "Income Tax", ready: true },
    { code: "1702RT", name: "Annual Income Tax Return", sub: "Corporations — regular rate", cat: "Income Tax", ready: true },
    { code: "1702Q", name: "Quarterly Income Tax Return", sub: "Corporations & non-individuals", cat: "Income Tax", ready: true },
    { code: "2550Q", name: "Quarterly VAT Return", sub: "Value-Added Tax", cat: "Business Tax", ready: true },
    { code: "2551Q", name: "Quarterly Percentage Tax Return", sub: "Percentage Tax", cat: "Business Tax", ready: true },
    { code: "2307", name: "Certificate of Creditable Tax Withheld", sub: "At source (expanded)", cat: "Withholding", ready: true },
    { code: "2316", name: "Certificate of Compensation Payment", sub: "Tax withheld on compensation", cat: "Withholding", ready: true },
  ];

  // ---------- formatting ----------
  // BIR rule: do not enter centavos; 49c or less drop down, 50c or more round up.
  function roundPeso(n) {
    if (n == null || isNaN(n)) return 0;
    return Math.sign(n) * Math.round(Math.abs(n));
  }
  function fmtAmt(n, opts) {
    opts = opts || {};
    if (n === "" || n == null || isNaN(n)) return opts.blankZero ? "" : "";
    const v = opts.noRound ? Number(n) : roundPeso(Number(n));
    const neg = v < 0;
    const s = Math.abs(v).toLocaleString("en-PH", {
      minimumFractionDigits: opts.dec != null ? opts.dec : 0,
      maximumFractionDigits: opts.dec != null ? opts.dec : 0,
    });
    return neg ? "(" + s + ")" : s;
  }
  function num(v) {
    if (v === "" || v == null) return 0;
    const n = Number(String(v).replace(/,/g, ""));
    return isNaN(n) ? 0 : n;
  }

  // ---------- graduated income tax tables (TRAIN) ----------
  // Table 1: 2018–2022 ; Table 2: 2023 onward
  const TAX_TABLE_1 = [
    { upTo: 250000, base: 0, rate: 0, over: 0 },
    { upTo: 400000, base: 0, rate: 0.20, over: 250000 },
    { upTo: 800000, base: 30000, rate: 0.25, over: 400000 },
    { upTo: 2000000, base: 130000, rate: 0.30, over: 800000 },
    { upTo: 8000000, base: 490000, rate: 0.32, over: 2000000 },
    { upTo: Infinity, base: 2410000, rate: 0.35, over: 8000000 },
  ];
  const TAX_TABLE_2 = [
    { upTo: 250000, base: 0, rate: 0, over: 0 },
    { upTo: 400000, base: 0, rate: 0.15, over: 250000 },
    { upTo: 800000, base: 22500, rate: 0.20, over: 400000 },
    { upTo: 2000000, base: 102500, rate: 0.25, over: 800000 },
    { upTo: 8000000, base: 402500, rate: 0.30, over: 2000000 },
    { upTo: Infinity, base: 2202500, rate: 0.35, over: 8000000 },
  ];
  function graduatedTax(taxable, year) {
    const t = num(taxable);
    if (t <= 0) return 0;
    const table = Number(year) >= 2023 ? TAX_TABLE_2 : TAX_TABLE_1;
    for (const b of table) {
      if (t <= b.upTo) return b.base + (t - b.over) * b.rate;
    }
    return 0;
  }

  // ---------- 1701A computation ----------
  // d = data object of raw inputs (strings); returns computed numeric fields
  function compute1701A(d) {
    const year = (d.year || "").slice(0, 4);
    const rate = d.taxRate || "graduated"; // 'graduated' | 'eight'
    const sides = ["A", "B"]; // taxpayer, spouse
    const out = { A: {}, B: {} };

    sides.forEach((s) => {
      const o = out[s];
      // Graduated (OSD) — items 36-46
      o.i36 = num(d["i36" + s]);
      o.i37 = num(d["i37" + s]);
      o.i38 = o.i36 - o.i37;                 // net sales
      o.i39 = roundPeso(o.i38 * 0.40);       // OSD 40% of net sales
      o.i40 = o.i38 - o.i39;                 // net income
      o.i41 = num(d["i41" + s]);
      o.i42 = num(d["i42" + s]);
      o.i43 = num(d["i43" + s]);
      o.i44 = o.i41 + o.i42 + o.i43;         // total other income
      o.i45 = o.i40 + o.i44;                 // total taxable income
      o.i46 = roundPeso(graduatedTax(o.i45, year)); // tax due (graduated)

      // 8% — items 47-56
      o.i47 = num(d["i47" + s]);
      o.i48 = num(d["i48" + s]);
      o.i49 = o.i47 - o.i48;                 // net sales
      o.i50 = num(d["i50" + s]);
      o.i51 = num(d["i51" + s]);
      o.i52 = o.i50 + o.i51;                 // total other non-op
      o.i53 = o.i49 + o.i52;                 // total taxable
      o.i54 = 250000;                        // allowable reduction (only first 250k of one taxpayer)
      o.i55 = Math.max(0, o.i53 - o.i54);    // taxable income
      o.i56 = roundPeso(o.i55 * 0.08);       // tax due (8%)

      // chosen tax due
      o.taxDue = rate === "eight" ? o.i56 : o.i46;

      // credits 57-63
      o.i57 = num(d["i57" + s]);
      o.i58 = num(d["i58" + s]);
      o.i59 = num(d["i59" + s]);
      o.i60 = num(d["i60" + s]);
      o.i61 = num(d["i61" + s]);
      o.i62 = num(d["i62" + s]);
      o.i63 = num(d["i63" + s]);
      o.i64 = o.i57 + o.i58 + o.i59 + o.i60 + o.i61 + o.i62 + o.i63; // total credits
      o.i65 = o.taxDue - o.i64;              // net tax payable

      // Part II rollup
      o.i20 = o.taxDue;
      o.i21 = o.i64;
      o.i22 = o.i20 - o.i21;
      o.i23 = num(d["i23" + s]);             // 2nd installment portion (user)
      o.i24 = o.i22 - o.i23;
      o.i25 = num(d["i25" + s]);             // surcharge
      o.i26 = num(d["i26" + s]);             // interest
      o.i27 = num(d["i27" + s]);             // compromise
      o.i28 = o.i25 + o.i26 + o.i27;         // total penalties
      o.i29 = o.i24 + o.i28;                 // total amount payable
    });

    out.i30 = out.A.i29 + out.B.i29;         // aggregate
    return out;
  }

  // ---------- export ----------
  window.BIR = {
    Taxpayers, Filings, CATALOG,
    fmtAmt, num, roundPeso, graduatedTax,
    compute1701A,
    resetAll() { DB = blank(); persist(); },
    _db: () => DB,
  };
})();

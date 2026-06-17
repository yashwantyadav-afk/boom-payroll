
/*
 * boom Payroll — statutory calculation engine (server-side)
 * Ported verbatim from the front-end prototype so the browser and the API
 * compute identical figures. Pure functions, no DOM, fully unit-testable.
 *
 * FY 2025-26 / 2026-27 statutory basis (India). Verify against the latest
 * notifications before each financial year; constants live in DEFAULT_CONFIG
 * and are overridable per request (so config can come from the DB).
 */

const r = Math.round;

// Default statutory configuration (mirrors the SPA `state`). Override per call.
const DEFAULT_CONFIG = {
  basicPct: 0.5,
  monthDays: 30,
  metro: true,
  wageMinPct: 0.5,
  lwfOn: true,
  pf:   { on: true, eeRate: 12, erRate: 12, ceiling: 15000, epsCap: 1250, admin: 0.5 },
  esi:  { on: true, eeRate: 0.75, erRate: 3.25, threshold: 21000 },
  pt:   { on: true },
  bonus:{ on: true, pct: 8.33, wageCap: 7000, eligibilityGross: 21000 },
  tds:  { regime: 'new', sd: 75000, sdOld: 50000, rebateNew: 1200000, rebateOld: 500000, cess: 4 },
};

// State-wise Labour Welfare Fund (employee/employer monthly-equivalent).
const LWF = {
  Maharashtra: { ee: 25, er: 75, freq: 'Half-yearly' },
  Karnataka: { ee: 20, er: 40, freq: 'Yearly' },
  'Tamil Nadu': { ee: 20, er: 40, freq: 'Half-yearly' },
  Gujarat: { ee: 6, er: 12, freq: 'Half-yearly' },
  'West Bengal': { ee: 3, er: 15, freq: 'Half-yearly' },
  'Madhya Pradesh': { ee: 10, er: 30, freq: 'Half-yearly' },
  'Andhra Pradesh': { ee: 30, er: 70, freq: 'Yearly' },
};

// State-wise Professional Tax (monthly) based on gross.
function ptForState(s, g) {
  switch (s) {
    case 'Maharashtra': return g > 10000 ? 200 : 0;
    case 'Karnataka': return g >= 25000 ? 200 : 0;
    case 'Telangana': return g > 20000 ? 200 : (g >= 15001 ? 150 : 0);
    case 'Tamil Nadu': return g >= 21001 ? 208 : (g >= 15001 ? 130 : 0);
    case 'West Bengal': return g > 40000 ? 200 : (g >= 15001 ? 130 : (g >= 10001 ? 110 : 0));
    case 'Gujarat': return g >= 12000 ? 200 : 0;
    case 'Andhra Pradesh': return g > 20000 ? 200 : (g >= 15001 ? 150 : 0);
    case 'Madhya Pradesh': return g >= 15001 ? 208 : 0;
    case 'Kerala': return g >= 25000 ? 208 : 0;
    default: return 0;
  }
}

// New-regime annual tax (all-in: includes surcharge + cess).
function newRegimeTax(ti, cfg) {
  const sl = [[400000, 0], [800000, .05], [1200000, .10], [1600000, .15], [2000000, .20], [2400000, .25], [Infinity, .30]];
  let tax = 0, prev = 0;
  for (const [cap, rate] of sl) { if (ti > prev) { tax += (Math.min(ti, cap) - prev) * rate; prev = cap; } else break; }
  if (ti <= cfg.tds.rebateNew) tax = 0;
  let sur = 0; if (ti > 20000000) sur = tax * .25; else if (ti > 10000000) sur = tax * .15; else if (ti > 5000000) sur = tax * .10;
  return r((tax + sur) * (1 + cfg.tds.cess / 100));
}

// Old-regime annual tax (all-in: includes surcharge + cess).
function oldRegimeTax(ti, cfg) {
  const sl = [[250000, 0], [500000, .05], [1000000, .20], [Infinity, .30]];
  let tax = 0, prev = 0;
  for (const [cap, rate] of sl) { if (ti > prev) { tax += (Math.min(ti, cap) - prev) * rate; prev = cap; } else break; }
  if (ti <= cfg.tds.rebateOld) tax = 0;
  let sur = 0; if (ti > 20000000) sur = tax * .25; else if (ti > 10000000) sur = tax * .15; else if (ti > 5000000) sur = tax * .10;
  return r((tax + sur) * (1 + cfg.tds.cess / 100));
}

/**
 * Compute the full salary breakdown for one employee.
 * @param {object} emp  - { ctc, state, regime?, decl80c? }
 * @param {object} attendance - { totalDays, lop } (defaults to full month)
 * @param {object} configIn - statutory config overrides (merged over DEFAULT_CONFIG)
 */
function compute(emp, attendance, configIn) {
  const cfg = mergeConfig(configIn);
  const att = normAtt(attendance, cfg);

  const m = emp.ctc / 12;
  const basic = r(m * cfg.basicPct);
  const hra = r(basic * (cfg.metro ? 0.5 : 0.4));
  const erPFfull = cfg.pf.on ? r(cfg.pf.erRate / 100 * Math.min(basic, cfg.pf.ceiling)) : 0;
  const gratuity = r(.0481 * basic);
  let gross = r(m - erPFfull - gratuity);
  const esiApp = cfg.esi.on && gross <= cfg.esi.threshold;
  let erESIfull = esiApp ? r(cfg.esi.erRate / 100 * gross) : 0;
  if (esiApp) { gross = r(m - erPFfull - gratuity - erESIfull); erESIfull = r(cfg.esi.erRate / 100 * gross); }
  const special = Math.max(0, gross - basic - hra);

  const f = att.f;
  const eBasic = r(basic * f), eHra = r(hra * f), eSpecial = r(special * f), eGross = r(gross * f);

  const pfWage = Math.min(eBasic, cfg.pf.ceiling);
  const eePF = cfg.pf.on ? r(cfg.pf.eeRate / 100 * pfWage) : 0;
  const erPF = cfg.pf.on ? r(cfg.pf.erRate / 100 * pfWage) : 0;
  const eps = cfg.pf.on ? Math.min(r(.0833 * pfWage), cfg.pf.epsCap) : 0;
  const epf = erPF - eps;

  const eeESI = esiApp ? r(cfg.esi.eeRate / 100 * eGross) : 0;
  const erESI = esiApp ? r(cfg.esi.erRate / 100 * eGross) : 0;

  const pt = cfg.pt.on ? ptForState(emp.state, gross) : 0;
  const lwf = cfg.lwfOn ? (LWF[emp.state] ? LWF[emp.state].ee : 0) : 0;
  const lwfEr = cfg.lwfOn ? (LWF[emp.state] ? LWF[emp.state].er : 0) : 0;

  const regime = emp.regime || cfg.tds.regime;
  const annualGross = gross * 12;
  const sd = regime === 'new' ? cfg.tds.sd : cfg.tds.sdOld;
  const decl = regime === 'old' ? Math.min(emp.decl80c || 0, 150000) : 0;
  const taxable = Math.max(0, annualGross - sd - decl);
  const annualTax = regime === 'new' ? newRegimeTax(taxable, cfg) : oldRegimeTax(taxable, cfg);
  const tdsFull = r(annualTax / 12);
  const tds = r(tdsFull * f);

  const bonus = (cfg.bonus.on && gross <= cfg.bonus.eligibilityGross)
    ? r(cfg.bonus.pct / 100 * Math.min(eBasic, cfg.bonus.wageCap)) : 0;

  const wagesPct = gross > 0 ? basic / gross : 0;
  const totalDed = eePF + eeESI + pt + tds + lwf;
  const net = eGross - totalDed;
  const ctcMonthly = gross + erPFfull + gratuity + erESIfull + lwfEr + bonus;

  return {
    basic, hra, special, gross,
    eBasic, eHra, eSpecial, eGross,
    eePF, erPF, eps, epf, eeESI, erESI, erPFfull, erESIfull, gratuity,
    pt, tds, tdsFull, lwf, lwfEr, bonus,
    wagesPct, regime, esiApp, totalDed, net,
    annualTax, taxable, annualGross, ctcMonthly, att,
  };
}

function mergeConfig(c) {
  if (!c) return DEFAULT_CONFIG;
  return {
    ...DEFAULT_CONFIG, ...c,
    pf: { ...DEFAULT_CONFIG.pf, ...(c.pf || {}) },
    esi: { ...DEFAULT_CONFIG.esi, ...(c.esi || {}) },
    pt: { ...DEFAULT_CONFIG.pt, ...(c.pt || {}) },
    bonus: { ...DEFAULT_CONFIG.bonus, ...(c.bonus || {}) },
    tds: { ...DEFAULT_CONFIG.tds, ...(c.tds || {}) },
  };
}

function normAtt(a, cfg) {
  const total = (a && a.totalDays) || cfg.monthDays;
  const lop = (a && a.lop) || 0;
  const paid = Math.max(0, total - lop);
  return { total, lop, paid, f: total > 0 ? paid / total : 1 };
}



export { compute, ptForState, newRegimeTax, oldRegimeTax, LWF, DEFAULT_CONFIG, mergeConfig };

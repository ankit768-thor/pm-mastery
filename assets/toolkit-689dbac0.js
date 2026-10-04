/* PM Mastery Toolkit: calculators (pure functions) + page wiring.
   The math lives in PMToolkit.* so tests/check_toolkit.js can run it without a browser. */
(function (root) {
  'use strict';

  // Two-sided z for significance level, and z for power (standard normal quantiles).
  var Z_ALPHA = { '0.1': 1.6449, '0.05': 1.9600, '0.01': 2.5758 };
  var Z_POWER = { '0.8': 0.8416, '0.9': 1.2816 };

  function num(x) { return typeof x === 'number' && isFinite(x); }

  // RICE (popularized by Intercom): Reach x Impact x Confidence / Effort.
  function rice(reach, impact, confidencePct, effort) {
    if (![reach, impact, confidencePct, effort].every(num) || effort <= 0 || reach < 0) return null;
    return reach * impact * (confidencePct / 100) / effort;
  }

  // ICE: Impact, Confidence, Ease each scored 1-10; averaged here (some teams multiply).
  function ice(impact, confidence, ease) {
    if (![impact, confidence, ease].every(num)) return null;
    return (impact + confidence + ease) / 3;
  }

  // WSJF (as used in SAFe): Cost of Delay / Job size, where
  // Cost of Delay = business value + time criticality + risk reduction/opportunity enablement.
  function wsjf(value, timeCriticality, riskReduction, jobSize) {
    if (![value, timeCriticality, riskReduction, jobSize].every(num) || jobSize <= 0) return null;
    var cod = value + timeCriticality + riskReduction;
    return { costOfDelay: cod, score: cod / jobSize };
  }

  // A/B test sample size per variant for a conversion-rate metric (two-sided test,
  // normal approximation, unpooled variance). Dedicated calculators that use pooled
  // variance or exact methods can differ by a few percent.
  function sampleSize(opts) {
    var p1 = opts.baselinePct / 100;
    var mde = opts.mdePct / 100;
    var p2 = opts.relative ? p1 * (1 + mde) : p1 + mde;
    var za = Z_ALPHA[String(opts.alpha)], zb = Z_POWER[String(opts.power)];
    if (!(p1 > 0 && p1 < 1) || !(p2 > 0 && p2 < 1) || p1 === p2 || !za || !zb) return null;
    var n = Math.pow(za + zb, 2) * (p1 * (1 - p1) + p2 * (1 - p2)) / Math.pow(p2 - p1, 2);
    n = Math.ceil(n);
    var out = { p1: p1, p2: p2, perVariant: n, total: n * 2, days: null };
    if (num(opts.dailyVisitors) && opts.dailyVisitors > 0) out.days = Math.ceil(out.total / opts.dailyVisitors);
    return out;
  }

  // Simple subscription unit economics (constant churn assumption).
  function unitEconomics(opts) {
    var arpu = opts.arpu, gm = opts.grossMarginPct / 100, churn = opts.monthlyChurnPct / 100, cac = opts.cac;
    if (![arpu, gm, churn, cac].every(num) || arpu <= 0 || gm <= 0 || churn <= 0 || cac < 0) return null;
    var monthlyGrossProfit = arpu * gm;
    var lifetimeMonths = 1 / churn;
    var ltv = monthlyGrossProfit * lifetimeMonths;
    return {
      monthlyGrossProfit: monthlyGrossProfit,
      lifetimeMonths: lifetimeMonths,
      ltv: ltv,
      ltvToCac: cac > 0 ? ltv / cac : null,
      paybackMonths: cac / monthlyGrossProfit,
    };
  }

  root.PMToolkit = { rice: rice, ice: ice, wsjf: wsjf, sampleSize: sampleSize, unitEconomics: unitEconomics };

  if (typeof document === 'undefined') return;

  // ------------------------------------------------------------------ page wiring
  var $ = function (sel, el) { return (el || document).querySelector(sel); };
  var fmt = function (x, d) { return x == null ? '—' : Number(x).toLocaleString('en-US', { maximumFractionDigits: d == null ? 1 : d }); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('pm-toolkit-' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('pm-toolkit-' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // A ranked-table scoring tool (RICE, ICE, WSJF share the same row editor).
  function scoringTable(cfg) {
    var host = $(cfg.host);
    if (!host) return;
    var rows = store.get(cfg.key, cfg.example);
    var body = $('tbody', host), out = $('.tk-ranking', host);

    function render() {
      body.innerHTML = rows.map(function (r, i) {
        return '<tr>' + cfg.fields.map(function (f) {
          var label = esc(f.label + ' for row ' + (i + 1));
          if (f.options) {
            return '<td><select data-i="' + i + '" data-f="' + f.key + '" aria-label="' + label + '">' +
              f.options.map(function (o) { return '<option value="' + o[0] + '"' + (String(r[f.key]) === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') +
              '</select></td>';
          }
          return '<td><input ' + (f.text ? 'type="text"' : 'type="number" inputmode="decimal" min="' + (f.min == null ? 0 : f.min) + '" step="any"') +
            ' data-i="' + i + '" data-f="' + f.key + '" value="' + esc(r[f.key] == null ? '' : r[f.key]) + '" aria-label="' + label + '"></td>';
        }).join('') + '<td><button type="button" class="tk-link" data-del="' + i + '" aria-label="Remove row ' + (i + 1) + '">Remove</button></td></tr>';
      }).join('');
      rank();
    }
    function rank() {
      var scored = rows.map(function (r) {
        var v = cfg.score(r);
        return { name: r.name || '(unnamed)', score: v == null ? null : (typeof v === 'object' ? v.score : v), detail: v };
      }).filter(function (x) { return x.score != null; }).sort(function (a, b) { return b.score - a.score; });
      out.innerHTML = scored.length
        ? '<ol>' + scored.map(function (x) { return '<li><span>' + esc(x.name) + '</span><b>' + fmt(x.score, cfg.digits) + '</b></li>'; }).join('') + '</ol>'
        : '<p class="tk-muted">Fill in a row to see the ranking.</p>';
      store.set(cfg.key, rows);
    }
    host.addEventListener('input', function (e) {
      var t = e.target, i = t.getAttribute('data-i'), f = t.getAttribute('data-f');
      if (i == null || !f) return;
      var field = cfg.fields.filter(function (x) { return x.key === f; })[0];
      rows[+i][f] = field.text ? t.value : (t.value === '' ? null : Number(t.value));
      rank();
    });
    host.addEventListener('click', function (e) {
      var d = e.target.getAttribute('data-del');
      if (d != null) { rows.splice(+d, 1); render(); }
      if (e.target.classList.contains('tk-add')) { rows.push(cfg.blank()); render(); var first = body.lastElementChild && body.lastElementChild.querySelector('input, select'); if (first) first.focus(); }
      if (e.target.classList.contains('tk-reset')) { rows = JSON.parse(JSON.stringify(cfg.example)); render(); }
    });
    render();
  }

  var IMPACT = [[3, '3 · massive'], [2, '2 · high'], [1, '1 · medium'], [0.5, '0.5 · low'], [0.25, '0.25 · minimal']];
  var CONF = [[100, '100% · high'], [80, '80% · medium'], [50, '50% · low']];
  var FIB = [1, 2, 3, 5, 8, 13, 20].map(function (x) { return [x, String(x)]; });

  scoringTable({
    host: '#rice', key: 'rice', digits: 0,
    fields: [{ key: 'name', label: 'Idea', text: true }, { key: 'reach', label: 'Reach' }, { key: 'impact', label: 'Impact', options: IMPACT },
      { key: 'confidence', label: 'Confidence', options: CONF }, { key: 'effort', label: 'Effort', min: 0.1 }],
    score: function (r) { return rice(r.reach, Number(r.impact), Number(r.confidence), r.effort); },
    blank: function () { return { name: '', reach: null, impact: 1, confidence: 80, effort: null }; },
    example: [
      { name: 'Saved addresses at checkout', reach: 12000, impact: 1, confidence: 80, effort: 2 },
      { name: 'Live order tracking map', reach: 20000, impact: 2, confidence: 50, effort: 6 },
      { name: 'Reorder last meal', reach: 8000, impact: 2, confidence: 80, effort: 1 },
    ],
  });
  scoringTable({
    host: '#ice', key: 'ice', digits: 1,
    fields: [{ key: 'name', label: 'Idea', text: true }, { key: 'impact', label: 'Impact (1-10)', min: 1 },
      { key: 'confidence', label: 'Confidence (1-10)', min: 1 }, { key: 'ease', label: 'Ease (1-10)', min: 1 }],
    score: function (r) { return ice(r.impact, r.confidence, r.ease); },
    blank: function () { return { name: '', impact: null, confidence: null, ease: null }; },
    example: [
      { name: 'Referral bonus for first order', impact: 7, confidence: 6, ease: 8 },
      { name: 'Onboarding checklist', impact: 6, confidence: 7, ease: 6 },
    ],
  });
  scoringTable({
    host: '#wsjf', key: 'wsjf', digits: 2,
    fields: [{ key: 'name', label: 'Job', text: true }, { key: 'value', label: 'Business value', options: FIB },
      { key: 'time', label: 'Time criticality', options: FIB }, { key: 'risk', label: 'Risk reduction / opportunity', options: FIB },
      { key: 'size', label: 'Job size', options: FIB }],
    score: function (r) { return wsjf(Number(r.value), Number(r.time), Number(r.risk), Number(r.size)); },
    blank: function () { return { name: '', value: 1, time: 1, risk: 1, size: 1 }; },
    example: [
      { name: 'Payment provider migration (deadline)', value: 5, time: 20, risk: 8, size: 13 },
      { name: 'New loyalty tier', value: 13, time: 3, risk: 2, size: 8 },
      { name: 'Fix flaky login', value: 8, time: 8, risk: 5, size: 3 },
    ],
  });

  // Sample size
  var ss = $('#sample-size form');
  if (ss) {
    var runSS = function () {
      var f = ss.elements;
      var r = sampleSize({
        baselinePct: Number(f.baseline.value), mdePct: Number(f.mde.value), relative: f.mdetype.value === 'relative',
        alpha: f.alpha.value, power: f.power.value, dailyVisitors: f.daily.value === '' ? null : Number(f.daily.value),
      });
      $('#sample-size .tk-result').innerHTML = r
        ? '<p><b>' + fmt(r.perVariant, 0) + '</b> users per variant · <b>' + fmt(r.total, 0) + '</b> total</p>' +
          '<p class="tk-muted">Detecting a change from ' + fmt(r.p1 * 100, 2) + '% to ' + fmt(r.p2 * 100, 2) + '%' +
          (r.days ? ' · about <b>' + fmt(r.days, 0) + ' days</b> at your daily traffic (run full weeks to cover weekday effects)' : '') + '.</p>'
        : '<p class="tk-warn">Check the inputs: the baseline and the target rate must both be between 0% and 100%, and the effect must be non-zero.</p>';
    };
    ss.addEventListener('input', runSS);
    ss.addEventListener('submit', function (e) { e.preventDefault(); runSS(); });
    runSS();
  }

  // Unit economics
  var ue = $('#unit-economics form');
  if (ue) {
    var runUE = function () {
      var f = ue.elements;
      var r = unitEconomics({ arpu: Number(f.arpu.value), grossMarginPct: Number(f.margin.value), monthlyChurnPct: Number(f.churn.value), cac: Number(f.cac.value) });
      $('#unit-economics .tk-result').innerHTML = r
        ? '<dl class="tk-dl"><div><dt>Gross profit / customer / month</dt><dd>' + fmt(r.monthlyGrossProfit, 2) + '</dd></div>' +
          '<div><dt>Expected lifetime</dt><dd>' + fmt(r.lifetimeMonths, 1) + ' months</dd></div>' +
          '<div><dt>LTV (gross-profit basis)</dt><dd>' + fmt(r.ltv, 2) + '</dd></div>' +
          '<div><dt>LTV : CAC</dt><dd>' + (r.ltvToCac == null ? '—' : fmt(r.ltvToCac, 2) + ' : 1') + '</dd></div>' +
          '<div><dt>CAC payback</dt><dd>' + fmt(r.paybackMonths, 1) + ' months</dd></div></dl>'
        : '<p class="tk-warn">Enter a positive ARPU, gross margin and churn rate.</p>';
    };
    ue.addEventListener('input', runUE);
    ue.addEventListener('submit', function (e) { e.preventDefault(); runUE(); });
    runUE();
  }

  // Copy buttons for templates
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-copy]');
    if (!b) return;
    var pre = document.getElementById(b.getAttribute('data-copy'));
    var done = function () { var t = b.textContent; b.textContent = 'Copied'; setTimeout(function () { b.textContent = t; }, 1500); };
    if (navigator.clipboard && pre) navigator.clipboard.writeText(pre.textContent).then(done, function () { selectText(pre); });
    else if (pre) selectText(pre);
  });
  function selectText(el) { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
})(typeof globalThis !== 'undefined' ? globalThis : this);

// Run: /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc tests/check_toolkit.js
// (or any JS engine that has load()). Checks the toolkit calculator math.
load(Array.prototype.slice.call(arguments)[0] || 'assets/toolkit.js');
var T = globalThis.PMToolkit, fails = 0;
function eq(name, got, want, tol) {
  var ok = got === want || (typeof got === 'number' && Math.abs(got - want) <= (tol || 1e-9));
  if (!ok) { fails++; print('FAIL ' + name + ': got ' + got + ', want ' + want); }
}
eq('rice', T.rice(1000, 2, 80, 2), 800);
eq('rice zero effort', T.rice(1000, 2, 80, 0), null);
eq('ice average', T.ice(6, 7, 8), 7);
var w = T.wsjf(8, 8, 5, 3); eq('wsjf cod', w.costOfDelay, 21); eq('wsjf score', w.score, 7);
// 10% baseline, +10% relative, alpha .05, power .8: (1.96+0.8416)^2*(.09+.0979)/.01^2 = 14748.2 -> 14749
var s = T.sampleSize({ baselinePct: 10, mdePct: 10, relative: true, alpha: 0.05, power: 0.8, dailyVisitors: 5000 });
eq('sample per variant', s.perVariant, 14749); eq('sample total', s.total, 29498); eq('sample days', s.days, 6);
eq('absolute mde', T.sampleSize({ baselinePct: 10, mdePct: 1, relative: false, alpha: 0.05, power: 0.8 }).perVariant, 14749);
eq('invalid sample', T.sampleSize({ baselinePct: 95, mdePct: 10, relative: true, alpha: 0.05, power: 0.8 }), null);
var u = T.unitEconomics({ arpu: 10, grossMarginPct: 70, monthlyChurnPct: 5, cac: 50 });
eq('ltv', u.ltv, 140, 1e-9); eq('ltv:cac', u.ltvToCac, 2.8, 1e-9); eq('payback', u.paybackMonths, 50 / 7, 1e-9); eq('lifetime', u.lifetimeMonths, 20, 1e-9);
eq('ue zero churn', T.unitEconomics({ arpu: 10, grossMarginPct: 70, monthlyChurnPct: 0, cac: 50 }), null);
print(fails ? fails + ' check(s) failed' : 'all toolkit checks passed');
if (fails) throw new Error('toolkit checks failed');

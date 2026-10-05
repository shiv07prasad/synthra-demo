import { getRun } from "../src/engine/run.ts";
import { spearmanMatrix } from "../src/engine/metrics.ts";

const t0 = performance.now();
const run = getRun();
console.log(`built in ${(performance.now() - t0).toFixed(0)}ms`);
const p = run.profile;
console.log("age comps", p.age.comps.map((c) => `${c.w.toFixed(2)} N(${c.mean.toFixed(1)}, ${c.sd.toFixed(1)})`));
console.log("hours median", p.hours.median, "call slope", p.call.slope.toFixed(2), "rho age-call", p.call.rhoAge.toFixed(2));
console.log("amount skew", p.amount.skew.toFixed(2), "max", p.amount.max, "median", p.amount.median, "naive", p.amount.naive);
console.log("scam", p.scam);
console.log("channel", p.channel);
console.log("recovery by bucket", p.recoveryByBucket.map((v) => v.toFixed(2)));
console.log("cohort", p.cohort, "boost", run.passes.boost, "langStateV", p.languageStateV.toFixed(2), "text", p.text);
console.log("real spearman", spearmanMatrix(run.real).map((r) => r.map((v) => v.toFixed(2)).join(" ")));
for (const k of ["naive", "mid", "final"] as const) {
  console.log(`\n== ${k}`);
  for (const c of run.checks[k]) console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.test.padEnd(22)} ${c.target.padEnd(20)} ${c.display}`);
}
console.log("neardup", run.nearDup);
const naiveAmounts = run.passes.naive.map((r) => r.amount_lost_inr);
console.log("naive max", Math.max(...naiveAmounts), "clipped share", (naiveAmounts.filter((v) => v === 500).length / naiveAmounts.length).toFixed(3));
const med = (x: number[]) => [...x].sort((a, b) => a - b)[Math.floor(x.length / 2)];
console.log("naive median", med(naiveAmounts), "real median", med(run.real.map((r) => r.amount_lost_inr)));

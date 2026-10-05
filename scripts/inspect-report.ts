import { getRun } from "../src/engine/run.ts";
import { computeReport } from "../src/engine/report.ts";

const run = getRun();
const t0 = performance.now();
const r = computeReport(run);
console.log(`report in ${(performance.now() - t0).toFixed(0)}ms`);
console.log("fidelity score", r.fidelityScore.toFixed(1));
r.numeric.forEach((c) => console.log(c.key, "KS", c.ks.toFixed(3), "median", c.realMedian, c.synthMedian));
r.categorical.forEach((c) => console.log(c.key, "JSD", c.jsd.toFixed(4), "TVD", c.tvd.toFixed(3)));
console.log("max drift", r.corr.maxDrift.toFixed(3));
console.log("privacy", JSON.stringify(r.privacy.medianDcr), r.privacy.nearCopies, r.privacy.victims, "leaks", r.privacy.leaks);
console.log("dcr naive first bins", r.privacy.dcr.naive.slice(0, 6).map((v) => v.toFixed(3)), "final", r.privacy.dcr.final.slice(0, 6).map((v) => v.toFixed(3)));
console.log("utility TRTR", r.utility.trtr.toFixed(3), "TSTR", r.utility.tstr.toFixed(3), "ratio", r.utility.ratio.toFixed(3), "pos rate", r.utility.positiveRate.toFixed(3));
console.log("drivers real", r.utility.driversReal.map((d) => `${d.name} ${d.weight.toFixed(2)}`));
console.log("drivers synth", r.utility.driversSynth.map((d) => `${d.name} ${d.weight.toFixed(2)}`));
console.log("fairness", r.fairness.map((f) => `${f.label}: ${(f.real * 100).toFixed(1)}% → ${(f.synth * 100).toFixed(1)}%`));

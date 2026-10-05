import { CHANNELS, isCohort, type ScamRecord } from "../data/schema.ts";
import { dcrMatcher, histogram, spearmanMatrix } from "../engine/metrics.ts";
import type { Run } from "../engine/run.ts";

// Pre-computed chart data so the 30fps theatre render only slices arrays.

const log10 = Math.log10;
const H = (rows: ScamRecord[], f: keyof ScamRecord, bins: number, lo: number, hi: number, tx = (v: number) => v) =>
  histogram(rows.map((r) => tx(Number(r[f]))), bins, lo, hi);

const amountHist = (rows: ScamRecord[]) => H(rows, "amount_lost_inr", 16, 2.6, 6.4, log10);

export function deriveViz(run: Run) {
  const { real, passes, profile: p } = run;
  const match = dcrMatcher(real);

  const dupCohort = passes.naive
    .map((row, index) => ({ row, index, source: match(row) }))
    .filter((r) => r.source >= 0)
    .slice(0, 5);
  const modelCohort = passes.final
    .map((row, index) => ({ row, index, source: -1 }))
    .filter((r) => isCohort(r.row))
    .slice(0, 5);

  return {
    hist: {
      victim_age: H(real, "victim_age", 14, 18, 88),
      amount_lost_inr: amountHist(real),
      hours_to_report: H(real, "hours_to_report", 14, -0.6, 2.9, log10),
      call_duration_min: H(real, "call_duration_min", 14, 0, 120),
    },
    synthAmount: {
      naive: amountHist(passes.naive),
      mid: amountHist(passes.mid),
      final: amountHist(passes.final),
    },
    corr: spearmanMatrix(real),
    scamShares: Object.entries(p.scam).sort((a, b) => b[1] - a[1]) as [string, number][],
    channelShares: CHANNELS.map((c) => [c, p.channel[c]] as [string, number]),
    piiPairs: real.slice(0, 3).map((r, i) => ({ real: r, fake: passes.final[i] })),
    cohortRows: { dup: dupCohort, model: modelCohort },
  };
}

export type Viz = ReturnType<typeof deriveViz>;

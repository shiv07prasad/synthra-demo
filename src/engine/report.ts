import { CATEGORICAL_COLS, CHANNELS, LANGUAGES, NUMERIC_COLS, SCAM_TYPES, STATES, isCohort, type ScamRecord } from "../data/schema.ts";
import { histogram, jsd, ks, median, proportions, sd, spearmanMatrix } from "./metrics.ts";
import { JSD_MAX, KS_MAX, type Run } from "./run.ts";

// Everything the Report Card shows, computed from the real rows and the certified synthetic pass.

export const NUMERIC_AXES = {
  victim_age: { bins: 14, lo: 18, hi: 88, log: false, ticks: [[20, "20"], [40, "40"], [60, "60"], [80, "80"]], unit: "years" },
  amount_lost_inr: { bins: 16, lo: 2.6, hi: 6.4, log: true, ticks: [[3, "₹1k"], [4, "₹10k"], [5, "₹1L"], [6, "₹10L"]], unit: "₹, log scale" },
  hours_to_report: { bins: 14, lo: -0.6, hi: 2.9, log: true, ticks: [[0, "1h"], [1, "10h"], [2, "100h"]], unit: "hours, log scale" },
  call_duration_min: { bins: 14, lo: 0, hi: 120, log: false, ticks: [[0, "0"], [30, "30"], [60, "60"], [90, "90"]], unit: "minutes" },
} as const;

const CATEGORY_SETS = { scam_type: SCAM_TYPES, channel: CHANNELS, state: STATES, language: LANGUAGES } as const;

export interface NumericFidelity {
  key: (typeof NUMERIC_COLS)[number];
  ks: number;
  pass: boolean;
  real: number[];
  synth: number[];
  realMedian: number;
  synthMedian: number;
}

export interface CategoricalFidelity {
  key: (typeof CATEGORICAL_COLS)[number];
  jsd: number;
  tvd: number;
  pass: boolean;
  categories: string[];
  real: number[];
  synth: number[];
}

// ---------- utility: logistic regression, train-synthetic-test-real ----------

export const FEATURE_NAMES = [
  "victim_age",
  "amount_lost_inr",
  "hours_to_report",
  "call_duration_min",
  ...SCAM_TYPES.slice(1).map((s) => `scam: ${s}`),
  ...CHANNELS.slice(1).map((c) => `channel: ${c}`),
  "regional language",
];

function features(r: ScamRecord): number[] {
  return [
    (r.victim_age - 40) / 16,
    (Math.log(r.amount_lost_inr) - 10.5) / 1.5,
    (Math.log(r.hours_to_report) - 2.6) / 1.3,
    (r.call_duration_min - 35) / 16,
    ...SCAM_TYPES.slice(1).map((s) => (r.scam_type === s ? 1 : 0)),
    ...CHANNELS.slice(1).map((c) => (r.channel === c ? 1 : 0)),
    r.language !== "Hindi" && r.language !== "English" ? 1 : 0,
  ];
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

function fitLogistic(rows: ScamRecord[], iters = 500, lr = 0.5, l2 = 0.01) {
  const X = rows.map(features);
  const y = rows.map((r) => (r.funds_recovered ? 1 : 0));
  const d = X[0].length;
  const w = new Array<number>(d).fill(0);
  let b = 0;
  for (let it = 0; it < iters; it++) {
    const gw = new Array<number>(d).fill(0);
    let gb = 0;
    for (let i = 0; i < X.length; i++) {
      const err = sigmoid(X[i].reduce((s, v, k) => s + v * w[k], b)) - y[i];
      for (let k = 0; k < d; k++) gw[k] += err * X[i][k];
      gb += err;
    }
    for (let k = 0; k < d; k++) w[k] -= lr * (gw[k] / X.length + l2 * w[k]);
    b -= (lr * gb) / X.length;
  }
  return { w, b, predict: (r: ScamRecord) => sigmoid(features(r).reduce((s, v, k) => s + v * w[k], b)) };
}

// Area under the ROC curve via the rank-sum (Mann–Whitney) identity.
function auc(scores: number[], labels: boolean[]): number {
  const idx = scores.map((s, i) => [s, labels[i]] as const).sort((a, b) => a[0] - b[0]);
  let rankSum = 0;
  let pos = 0;
  idx.forEach(([, l], i) => {
    if (l) {
      rankSum += i + 1;
      pos++;
    }
  });
  const neg = idx.length - pos;
  return (rankSum - (pos * (pos + 1)) / 2) / (pos * neg);
}

function topDrivers(w: number[], n = 3) {
  return w
    .map((v, i) => ({ name: FEATURE_NAMES[i], weight: v }))
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .slice(0, n);
}

// ---------- privacy: distance to closest real record ----------

function dcrDistances(real: ScamRecord[], synth: ScamRecord[], skipSelf = false): number[] {
  const num = (r: ScamRecord) => [r.victim_age, Math.log(r.amount_lost_inr), Math.log(r.hours_to_report), r.call_duration_min];
  const realNum = real.map(num);
  const scales = [0, 1, 2, 3].map((k) => sd(realNum.map((f) => f[k])));
  const cat = (r: ScamRecord) => [r.scam_type, r.channel, r.state, r.language, String(r.funds_recovered)];
  const realCat = real.map(cat);

  return synth.map((s, si) => {
    const f = num(s);
    const c = cat(s);
    let best = Infinity;
    for (let i = 0; i < real.length; i++) {
      if (skipSelf && i === si) continue;
      let mismatch = 0;
      for (let k = 0; k < 5; k++) if (c[k] !== realCat[i][k]) mismatch++;
      if (mismatch >= best) continue;
      let d2 = 0;
      for (let k = 0; k < 4; k++) d2 += ((f[k] - realNum[i][k]) / scales[k]) ** 2;
      best = Math.min(best, mismatch + Math.sqrt(d2));
    }
    return best;
  });
}

export const DCR_AXIS = { bins: 30, lo: 0, hi: 6 };

// ---------- assemble ----------

export function computeReport(run: Run) {
  const { real, passes } = run;
  const synth = passes.final;

  const numeric: NumericFidelity[] = NUMERIC_COLS.map((key) => {
    const ax = NUMERIC_AXES[key];
    const tx = (v: number) => (ax.log ? Math.log10(v) : v);
    const r = real.map((row) => row[key]);
    const s = synth.map((row) => row[key]);
    const v = ks(r, s);
    return {
      key,
      ks: v,
      pass: v <= KS_MAX,
      real: histogram(r.map(tx), ax.bins, ax.lo, ax.hi),
      synth: histogram(s.map(tx), ax.bins, ax.lo, ax.hi),
      realMedian: median(r),
      synthMedian: median(s),
    };
  });

  const categorical: CategoricalFidelity[] = CATEGORICAL_COLS.map((key) => {
    const cats = CATEGORY_SETS[key] as readonly string[];
    const p = proportions(real.map((row) => row[key]), cats);
    const q = proportions(synth.map((row) => row[key]), cats);
    const v = jsd(p, q);
    return {
      key,
      jsd: v,
      tvd: 0.5 * p.reduce((s, pi, i) => s + Math.abs(pi - q[i]), 0),
      pass: v <= JSD_MAX,
      categories: [...cats],
      real: p,
      synth: q,
    };
  });

  const fidelityScore =
    (100 * (numeric.reduce((s, c) => s + (1 - c.ks), 0) + categorical.reduce((s, c) => s + (1 - c.tvd), 0))) /
    (numeric.length + categorical.length);

  const corrReal = spearmanMatrix(real);
  const corrSynth = spearmanMatrix(synth);
  const corrDiff = corrReal.map((row, i) => row.map((v, j) => Math.abs(v - corrSynth[i][j])));

  const dcrNaive = dcrDistances(real, passes.naive);
  const dcrFinal = dcrDistances(real, synth);
  const dcrReal = dcrDistances(real, real, true);

  // Utility: real-trained baseline via 5-fold CV vs a model trained only on synthetic rows.
  const labels = real.map((r) => r.funds_recovered);
  const cvScores = new Array<number>(real.length);
  for (let fold = 0; fold < 5; fold++) {
    const model = fitLogistic(real.filter((_, i) => i % 5 !== fold));
    real.forEach((r, i) => {
      if (i % 5 === fold) cvScores[i] = model.predict(r);
    });
  }
  const synthModel = fitLogistic(synth);
  const realModel = fitLogistic(real);
  const trtr = auc(cvScores, labels);
  const tstr = auc(real.map(synthModel.predict), labels);

  const share = (rows: ScamRecord[], f: (r: ScamRecord) => boolean) => rows.filter(f).length / rows.length;
  const isRegional = (r: ScamRecord) => r.language !== "Hindi" && r.language !== "English";
  const fairness = [
    { label: "65+ · regional language", real: share(real, isCohort), synth: share(synth, isCohort) },
    { label: "Aged 65+", real: share(real, (r) => r.victim_age >= 65), synth: share(synth, (r) => r.victim_age >= 65) },
    { label: "Regional-language reports", real: share(real, isRegional), synth: share(synth, isRegional) },
    { label: "Contacted via Telegram", real: share(real, (r) => r.channel === "Telegram"), synth: share(synth, (r) => r.channel === "Telegram") },
  ];

  return {
    numeric,
    categorical,
    fidelityScore,
    corr: { real: corrReal, synth: corrSynth, diff: corrDiff, maxDrift: Math.max(...corrDiff.flat()) },
    privacy: {
      dcr: {
        naive: histogram(dcrNaive, DCR_AXIS.bins, DCR_AXIS.lo, DCR_AXIS.hi),
        final: histogram(dcrFinal, DCR_AXIS.bins, DCR_AXIS.lo, DCR_AXIS.hi),
      },
      medianDcr: { final: median(dcrFinal), realToReal: median(dcrReal) },
      nearCopies: { naive: run.nearDup.naive.count, final: run.nearDup.final.count },
      victims: { naive: run.nearDup.naive.victims, final: run.nearDup.final.victims },
      leaks: run.checks.final.find((c) => c.id === "pii")!.value,
    },
    utility: {
      trtr,
      tstr,
      ratio: tstr / trtr,
      positiveRate: share(real, (r) => r.funds_recovered),
      driversReal: topDrivers(realModel.w),
      driversSynth: topDrivers(synthModel.w),
    },
    fairness,
  };
}

export type Report = ReturnType<typeof computeReport>;

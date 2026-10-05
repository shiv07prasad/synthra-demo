import type { ScamRecord } from "../data/schema.ts";

export const mean = (x: number[]) => x.reduce((s, v) => s + v, 0) / x.length;

export function sd(x: number[]): number {
  const m = mean(x);
  return Math.sqrt(x.reduce((s, v) => s + (v - m) ** 2, 0) / (x.length - 1));
}

export function median(x: number[]): number {
  const s = [...x].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function skewness(x: number[]): number {
  const m = mean(x);
  const s = sd(x);
  return x.reduce((acc, v) => acc + ((v - m) / s) ** 3, 0) / x.length;
}

// Two-sample Kolmogorov–Smirnov statistic: max gap between the two empirical CDFs.
export function ks(a: number[], b: number[]): number {
  const x = [...a].sort((p, q) => p - q);
  const y = [...b].sort((p, q) => p - q);
  let i = 0;
  let j = 0;
  let d = 0;
  while (i < x.length && j < y.length) {
    const v = Math.min(x[i], y[j]);
    while (i < x.length && x[i] <= v) i++;
    while (j < y.length && y[j] <= v) j++;
    d = Math.max(d, Math.abs(i / x.length - j / y.length));
  }
  return d;
}

export function proportions<T extends string>(values: T[], categories: readonly T[]): number[] {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return categories.map((c) => (counts.get(c) ?? 0) / values.length);
}

// Jensen–Shannon divergence, base 2 (0 = identical, 1 = disjoint).
export function jsd(p: number[], q: number[]): number {
  const kl = (a: number[], b: number[]) =>
    a.reduce((s, ai, i) => (ai > 0 ? s + ai * Math.log2(ai / b[i]) : s), 0);
  const m = p.map((pi, i) => (pi + q[i]) / 2);
  return 0.5 * kl(p, m) + 0.5 * kl(q, m);
}

function ranks(x: number[]): number[] {
  const idx = x.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
  const r = new Array<number>(x.length);
  for (let i = 0; i < idx.length; ) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) r[idx[k][1]] = avg;
    i = j + 1;
  }
  return r;
}

export function pearson(x: number[], y: number[]): number {
  const mx = mean(x);
  const my = mean(y);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < x.length; i++) {
    num += (x[i] - mx) * (y[i] - my);
    dx += (x[i] - mx) ** 2;
    dy += (y[i] - my) ** 2;
  }
  return num / Math.sqrt(dx * dy);
}

export const CORR_FIELDS = ["victim_age", "amount_lost_inr", "hours_to_report", "call_duration_min", "funds_recovered"] as const;
export const CORR_LABELS = ["age", "amount", "hours", "call", "recov."];

export function spearmanMatrix(rows: ScamRecord[]): number[][] {
  const cols = CORR_FIELDS.map((f) => ranks(rows.map((r) => Number(r[f]))));
  return cols.map((a) => cols.map((b) => pearson(a, b)));
}

export function cramersV(a: string[], b: string[]): number {
  const av = [...new Set(a)];
  const bv = [...new Set(b)];
  const n = a.length;
  const table = av.map(() => bv.map(() => 0));
  a.forEach((v, i) => table[av.indexOf(v)][bv.indexOf(b[i])]++);
  const rowSum = table.map((r) => r.reduce((s, v) => s + v, 0));
  const colSum = bv.map((_, j) => table.reduce((s, r) => s + r[j], 0));
  let chi2 = 0;
  table.forEach((r, i) =>
    r.forEach((obs, j) => {
      const exp = (rowSum[i] * colSum[j]) / n;
      if (exp > 0) chi2 += (obs - exp) ** 2 / exp;
    }),
  );
  return Math.sqrt(chi2 / (n * (Math.min(av.length, bv.length) - 1)));
}

// Distance to closest record: synthetic rows that match a real row on every categorical
// field and sit within `eps` of it in standardized numeric space are re-identifiable.
export function dcrMatcher(real: ScamRecord[], eps = 0.05): (row: ScamRecord) => number {
  const feats = (r: ScamRecord) => [
    r.victim_age,
    Math.log(r.amount_lost_inr),
    Math.log(r.hours_to_report),
    r.call_duration_min,
  ];
  const realFeats = real.map(feats);
  const scales = [0, 1, 2, 3].map((k) => sd(realFeats.map((f) => f[k])));
  const key = (r: ScamRecord) => `${r.scam_type}|${r.channel}|${r.state}|${r.language}|${r.funds_recovered}`;

  const byKey = new Map<string, number[]>();
  real.forEach((r, i) => byKey.set(key(r), [...(byKey.get(key(r)) ?? []), i]));

  return (row) => {
    const f = feats(row);
    for (const i of byKey.get(key(row)) ?? []) {
      const d = Math.sqrt(f.reduce((acc, v, k) => acc + ((v - realFeats[i][k]) / scales[k]) ** 2, 0));
      if (d < eps) return i;
    }
    return -1;
  };
}

export function nearDuplicates(real: ScamRecord[], synth: ScamRecord[], eps = 0.05) {
  const match = dcrMatcher(real, eps);
  let count = 0;
  const victims = new Set<number>();
  for (const s of synth) {
    const i = match(s);
    if (i >= 0) {
      count++;
      victims.add(i);
    }
  }
  return { count, victims: victims.size };
}

export function piiLeaks(real: ScamRecord[], synth: ScamRecord[]): number {
  const realPairs = new Set(real.map((r) => `${r.victim_name}|${r.phone_number}`));
  const realPhones = new Set(real.map((r) => r.phone_number));
  const realSnippets = new Set(real.map((r) => r.scam_message_snippet));
  return synth.filter(
    (s) =>
      realPairs.has(`${s.victim_name}|${s.phone_number}`) ||
      realPhones.has(s.phone_number) ||
      realSnippets.has(s.scam_message_snippet),
  ).length;
}

export function histogram(values: number[], bins: number, lo: number, hi: number): number[] {
  const out = new Array<number>(bins).fill(0);
  for (const v of values) {
    const b = Math.min(bins - 1, Math.max(0, Math.floor(((v - lo) / (hi - lo)) * bins)));
    out[b]++;
  }
  return out.map((c) => c / values.length);
}

import { generateRealDataset } from "../data/realDataset.ts";
import { CATEGORICAL_COLS, CHANNELS, LANGUAGES, NUMERIC_COLS, SCAM_TYPES, STATES, isCohort, type ScamRecord } from "../data/schema.ts";
import { jsd, ks, nearDuplicates, piiLeaks, proportions, spearmanMatrix } from "./metrics.ts";
import { profile, synthesize, type Passes, type Profile } from "./synthesize.ts";

export type Pillar = "Fidelity" | "Privacy" | "Fairness";
export type CheckId =
  | NumericColId
  | `jsd:${(typeof CATEGORICAL_COLS)[number]}`
  | "corr"
  | "dcr"
  | "pii"
  | "cohort";
type NumericColId = `ks:${(typeof NUMERIC_COLS)[number]}`;

export interface Check {
  id: CheckId;
  pillar: Pillar;
  test: string;
  target: string;
  value: number;
  threshold: string;
  pass: boolean;
  display: string;
}

const CATEGORIES = { scam_type: SCAM_TYPES, channel: CHANNELS, state: STATES, language: LANGUAGES } as const;

export const KS_MAX = 0.1;
export const JSD_MAX = 0.02;
export const CORR_MAX = 0.15;

export function runChecks(real: ScamRecord[], synth: ScamRecord[]): Check[] {
  const checks: Check[] = [];

  for (const col of NUMERIC_COLS) {
    const v = ks(real.map((r) => r[col]), synth.map((r) => r[col]));
    checks.push({ id: `ks:${col}`, pillar: "Fidelity", test: "KS distance", target: col, value: v, threshold: `≤ ${KS_MAX.toFixed(2)}`, pass: v <= KS_MAX, display: v.toFixed(3) });
  }

  for (const col of CATEGORICAL_COLS) {
    const cats = CATEGORIES[col] as readonly string[];
    const v = jsd(proportions(real.map((r) => r[col]), cats), proportions(synth.map((r) => r[col]), cats));
    checks.push({ id: `jsd:${col}`, pillar: "Fidelity", test: "JS divergence", target: col, value: v, threshold: `≤ ${JSD_MAX.toFixed(2)}`, pass: v <= JSD_MAX, display: v.toFixed(4) });
  }

  const a = spearmanMatrix(real);
  const b = spearmanMatrix(synth);
  const drift = Math.max(...a.flatMap((row, i) => row.map((v, j) => Math.abs(v - b[i][j]))));
  checks.push({ id: "corr", pillar: "Fidelity", test: "Correlation drift", target: "5×5 Spearman", value: drift, threshold: `≤ ${CORR_MAX.toFixed(2)}`, pass: drift <= CORR_MAX, display: drift.toFixed(3) });

  const dup = nearDuplicates(real, synth);
  checks.push({ id: "dcr", pillar: "Privacy", test: "Near-duplicates (DCR)", target: "all rows", value: dup.count, threshold: "= 0", pass: dup.count === 0, display: dup.count === 0 ? "0" : `${dup.count} rows` });

  const leaks = piiLeaks(real, synth);
  checks.push({ id: "pii", pillar: "Privacy", test: "Verbatim leakage", target: "PII + text", value: leaks, threshold: "= 0", pass: leaks === 0, display: String(leaks) });

  const realShare = real.filter(isCohort).length / real.length;
  const synthShare = synth.filter(isCohort).length / synth.length;
  checks.push({ id: "cohort", pillar: "Fairness", test: "Rare-cohort coverage", target: "65+ · regional", value: synthShare, threshold: `≥ ${(realShare * 100).toFixed(1)}%`, pass: synthShare >= realShare, display: `${(synthShare * 100).toFixed(1)}%` });

  return checks;
}

export interface Run {
  real: ScamRecord[];
  profile: Profile;
  passes: Passes;
  checks: { naive: Check[]; mid: Check[]; final: Check[] };
  nearDup: { naive: ReturnType<typeof nearDuplicates>; final: ReturnType<typeof nearDuplicates> };
}

let cached: Run | null = null;

export function getRun(): Run {
  if (cached) return cached;
  const real = generateRealDataset();
  const p = profile(real);
  const passes = synthesize(real, p);
  cached = {
    real,
    profile: p,
    passes,
    checks: {
      naive: runChecks(real, passes.naive),
      mid: runChecks(real, passes.mid),
      final: runChecks(real, passes.final),
    },
    nearDup: { naive: nearDuplicates(real, passes.naive), final: nearDuplicates(real, passes.final) },
  };
  return cached;
}

export function getRealDataset(): ScamRecord[] {
  return getRun().real;
}

import { clamp, mulberry32, normal, pick, weighted, type Rng } from "../lib/random.ts";
import { FIRST_NAMES, LAST_NAMES, fakePhone, fillTemplate } from "../data/realDataset.ts";
import { SYNTH_TEMPLATES, REAL_TEMPLATES } from "../data/templates.ts";
import {
  CHANNELS,
  LANGUAGES,
  REGIONAL_LANGUAGE,
  SCAM_TYPES,
  STATES,
  isCohort,
  type Channel,
  type Language,
  type ScamRecord,
  type ScamType,
  type State,
} from "../data/schema.ts";
import { cramersV, mean, median, pearson, sd, skewness } from "./metrics.ts";

const RECOVERY_EDGES = [2, 6, 24, 72];
const bucket = (h: number) => RECOVERY_EDGES.filter((e) => h >= e).length;

type Dist<T extends string> = Record<T, number>;

function freq<T extends string>(values: T[], categories: readonly T[]): Dist<T> {
  const out = Object.fromEntries(categories.map((c) => [c, 0])) as Dist<T>;
  values.forEach((v) => (out[v] += 1 / values.length));
  return out;
}

export interface Profile {
  n: number;
  age: { comps: { w: number; mean: number; sd: number }[] };
  hours: { mu: number; sigma: number; median: number };
  call: { slope: number; intercepts: Record<ScamType, number>; residSd: number; rhoAge: number };
  amount: {
    naive: { mean: number; sd: number };
    logn: Record<ScamType, { mu: number; sigma: number }>;
    skew: number;
    max: number;
    median: number;
  };
  scam: Dist<ScamType>;
  channelGivenScam: Record<ScamType, Dist<Channel>>;
  state: Dist<State>;
  languageGivenState: Record<State, Dist<Language>>;
  channel: Dist<Channel>;
  recoveryByBucket: number[];
  cohort: { count: number; share: number };
  languageStateV: number;
  text: { templates: number; hinglishShare: number };
}

export function profile(real: ScamRecord[]): Profile {
  const ages = real.map((r) => r.victim_age);
  const comps = [ages.filter((a) => a < 45), ages.filter((a) => a >= 45)].map((g) => ({
    w: g.length / ages.length,
    mean: mean(g),
    sd: sd(g),
  }));

  const logHours = real.map((r) => Math.log(r.hours_to_report));

  // Call duration = scam-type intercept + slope·age (within-group OLS).
  const byScam = (s: ScamType) => real.filter((r) => r.scam_type === s);
  let sxy = 0;
  let sxx = 0;
  for (const s of SCAM_TYPES) {
    const g = byScam(s);
    const mx = mean(g.map((r) => r.victim_age));
    const my = mean(g.map((r) => r.call_duration_min));
    g.forEach((r) => {
      sxy += (r.victim_age - mx) * (r.call_duration_min - my);
      sxx += (r.victim_age - mx) ** 2;
    });
  }
  const slope = sxy / sxx;
  const intercepts = Object.fromEntries(
    SCAM_TYPES.map((s) => {
      const g = byScam(s);
      return [s, mean(g.map((r) => r.call_duration_min)) - slope * mean(g.map((r) => r.victim_age))];
    }),
  ) as Record<ScamType, number>;
  const resid = real.map((r) => r.call_duration_min - intercepts[r.scam_type] - slope * r.victim_age);

  const amounts = real.map((r) => r.amount_lost_inr);
  const logn = Object.fromEntries(
    SCAM_TYPES.map((s) => {
      const logs = byScam(s).map((r) => Math.log(r.amount_lost_inr));
      return [s, { mu: mean(logs), sigma: sd(logs) }];
    }),
  ) as Record<ScamType, { mu: number; sigma: number }>;

  const recoveryByBucket = [0, 1, 2, 3, 4].map((b) => {
    const g = real.filter((r) => bucket(r.hours_to_report) === b);
    return g.length ? g.filter((r) => r.funds_recovered).length / g.length : 0;
  });

  const realSnippetsHinglish = real.filter((r) =>
    REAL_TEMPLATES[r.scam_type].some((t) => t.hinglish && r.scam_message_snippet.startsWith(t.text.split("{amt}")[0])),
  ).length;

  const cohortCount = real.filter(isCohort).length;

  return {
    n: real.length,
    age: { comps },
    hours: { mu: mean(logHours), sigma: sd(logHours), median: median(real.map((r) => r.hours_to_report)) },
    call: {
      slope,
      intercepts,
      residSd: sd(resid),
      rhoAge: pearson(ages, real.map((r) => r.call_duration_min)),
    },
    amount: {
      naive: { mean: mean(amounts), sd: sd(amounts) },
      logn,
      skew: skewness(amounts),
      max: Math.max(...amounts),
      median: median(amounts),
    },
    scam: freq(real.map((r) => r.scam_type), SCAM_TYPES),
    channelGivenScam: Object.fromEntries(
      SCAM_TYPES.map((s) => [s, freq(byScam(s).map((r) => r.channel), CHANNELS)]),
    ) as Record<ScamType, Dist<Channel>>,
    state: freq(real.map((r) => r.state), STATES),
    languageGivenState: Object.fromEntries(
      STATES.map((st) => [st, freq(real.filter((r) => r.state === st).map((r) => r.language), LANGUAGES)]),
    ) as Record<State, Dist<Language>>,
    channel: freq(real.map((r) => r.channel), CHANNELS),
    recoveryByBucket,
    cohort: { count: cohortCount, share: cohortCount / real.length },
    languageStateV: cramersV(real.map((r) => r.language), real.map((r) => r.state)),
    text: { templates: SCAM_TYPES.length, hinglishShare: realSnippetsHinglish / real.length },
  };
}

// ---------- generation ----------

function sampleAge(rng: Rng, p: Profile): number {
  const c = rng() < p.age.comps[0].w ? p.age.comps[0] : p.age.comps[1];
  return Math.round(clamp(normal(rng, c.mean, c.sd), 18, 88));
}

function sampleCall(rng: Rng, p: Profile, scam: ScamType, age: number): number {
  return Math.max(1, Math.round(p.call.intercepts[scam] + p.call.slope * age + normal(rng, 0, p.call.residSd)));
}

function sampleHours(rng: Rng, p: Profile): number {
  return Math.round(clamp(Math.exp(normal(rng, p.hours.mu, p.hours.sigma)), 0.3, 720) * 10) / 10;
}

const roundAmount = (v: number) => Math.max(500, Math.round(v / 100) * 100);

export function amountNaive(rng: Rng, p: Profile): number {
  return roundAmount(normal(rng, p.amount.naive.mean, p.amount.naive.sd));
}

export function amountLogNormal(rng: Rng, p: Profile, scam: ScamType): number {
  const { mu, sigma } = p.amount.logn[scam];
  return roundAmount(Math.exp(normal(rng, mu, sigma)));
}

function fakeIdentity(rng: Rng) {
  return { victim_name: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`, phone_number: fakePhone(rng) };
}

function synthSnippet(rng: Rng, scam: ScamType): string {
  return fillTemplate(rng, pick(rng, SYNTH_TEMPLATES[scam]).text);
}

function modelRow(rng: Rng, p: Profile, overrides: { age?: number; state?: State } = {}): ScamRecord {
  const scam = weighted(rng, p.scam);
  const state = overrides.state ?? weighted(rng, p.state);
  const age = overrides.age ?? sampleAge(rng, p);
  const hours = sampleHours(rng, p);
  const language = overrides.state ? (REGIONAL_LANGUAGE[state] as Language) : weighted(rng, p.languageGivenState[state]);
  return {
    ...fakeIdentity(rng),
    victim_age: age,
    state,
    language,
    scam_type: scam,
    channel: weighted(rng, p.channelGivenScam[scam]),
    amount_lost_inr: 0, // filled per pass
    call_duration_min: sampleCall(rng, p, scam, age),
    hours_to_report: hours,
    funds_recovered: rng() < p.recoveryByBucket[bucket(hours)],
    scam_message_snippet: synthSnippet(rng, scam),
  };
}

// Pass-1 cohort boost: oversample the rare cohort by jittering real exemplars (SMOTE-style).
// It looks harmless, but it carries real victims' quasi-identifiers into the output.
function cohortByDuplication(rng: Rng, real: ScamRecord[], k: number): ScamRecord[] {
  const exemplars = real.filter(isCohort);
  return Array.from({ length: k }, (_, i) => {
    const src = exemplars[i % exemplars.length];
    const jitter = () => 1 + (rng() - 0.5) * 0.008;
    return {
      ...src,
      ...fakeIdentity(rng),
      amount_lost_inr: roundAmount(src.amount_lost_inr * jitter()),
      hours_to_report: Math.max(0.3, Math.round(src.hours_to_report * jitter() * 10) / 10),
      scam_message_snippet: synthSnippet(rng, src.scam_type),
    };
  });
}

// Repaired cohort boost: sample the cohort from the fitted model, conditioned on age ≥ 65
// and a state with a regional language. No real row is ever touched.
function cohortByModel(rng: Rng, p: Profile, k: number): ScamRecord[] {
  const old = p.age.comps[1];
  const regionalStates = Object.fromEntries(
    STATES.filter((s) => REGIONAL_LANGUAGE[s]).map((s) => [s, p.state[s]]),
  ) as Partial<Record<State, number>>;
  return Array.from({ length: k }, () => {
    let age = 0;
    while (age < 65) age = Math.round(clamp(normal(rng, old.mean, old.sd), 18, 88));
    const row = modelRow(rng, p, { age, state: weighted(rng, regionalStates) });
    return { ...row, amount_lost_inr: amountLogNormal(rng, p, row.scam_type) };
  });
}

function permute<T>(items: T[], order: number[]): T[] {
  return order.map((i) => items[i]);
}

export interface Passes {
  naive: ScamRecord[];
  mid: ScamRecord[];
  final: ScamRecord[];
  boost: number;
}

export function synthesize(real: ScamRecord[], p: Profile, n = 5000): Passes {
  const boost = Math.round(n * p.cohort.share); // doubles the cohort's share
  const baseRng = mulberry32(7001);
  const naiveRng = mulberry32(7002);
  const lognRng = mulberry32(7003);

  const base = Array.from({ length: n - boost }, () => modelRow(baseRng, p));
  const naiveAmounts = base.map(() => amountNaive(naiveRng, p));
  const fixedAmounts = base.map((r) => amountLogNormal(lognRng, p, r.scam_type));

  const dupCohort = cohortByDuplication(mulberry32(7004), real, boost);
  const modelCohort = cohortByModel(mulberry32(7005), p, boost);

  const shuffleRng = mulberry32(7006);
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(shuffleRng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const withAmounts = (amounts: number[]) => base.map((r, i) => ({ ...r, amount_lost_inr: amounts[i] }));

  return {
    naive: permute([...withAmounts(naiveAmounts), ...dupCohort], order),
    mid: permute([...withAmounts(fixedAmounts), ...dupCohort], order),
    final: permute([...withAmounts(fixedAmounts), ...modelCohort], order),
    boost,
  };
}

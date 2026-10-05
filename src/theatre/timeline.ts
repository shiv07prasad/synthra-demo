import { formatInr } from "../data/schema.ts";
import type { Check, Run } from "../engine/run.ts";
import { spearmanMatrix } from "../engine/metrics.ts";

// Everything on screen is a pure function of `t` (seconds since "Generate Dataset" at 1× speed),
// so pause, 2× and replay come for free.

export type AgentId =
  | "orchestrator"
  | "numeric"
  | "categorical"
  | "correlation"
  | "text"
  | "pii"
  | "cohort"
  | "synth"
  | "critic";

export type Status = "queued" | "working" | "waiting" | "auditing" | "repairing" | "done";
export type Tone = "info" | "ok" | "warn" | "fail";

export interface LogEvent {
  t: number;
  agent: AgentId;
  text: string;
  tone: Tone;
}

export const T = {
  scanEnd: 2.8,
  scrollAt: 3.0,
  stamp: (i: number) => 0.25 + i * 0.2,
  dispatch: 4.2,
  windows: {
    pii: [4.4, 8.6],
    numeric: [4.6, 13.0],
    categorical: [4.8, 12.4],
    correlation: [5.0, 13.4],
    text: [5.2, 14.0],
    cohort: [5.6, 11.8],
  },
  synthStart: 14.6,
  rows: [15.2, 24.0] as const,
  synthDone: 24.4,
  criticStart: 25.0,
  checkReveal: (i: number) => 25.4 + i * 0.42,
  firstGrade: 30.4,
  beam1: [31.2, 32.2] as const,
  repair1: [32.2, 34.8] as const,
  passMid: 34.0,
  regrade1: 35.0,
  beam2: [36.1, 37.1] as const,
  repair2: [37.1, 39.4] as const,
  passFinal: 38.6,
  regrade2: 39.6,
  certify: 40.2,
  end: 42.0,
} as const;

export const PHASES = [
  { label: "Profile", start: 3.4, end: 14.4 },
  { label: "Synthesize", start: 14.4, end: 24.8 },
  { label: "Critique", start: 24.8, end: 40.0 },
  { label: "Certify", start: 40.0, end: T.end },
];

export function captionAt(t: number): string {
  if (t < 3.4) return "The Orchestrator is reading the schema. Nothing has been generated yet.";
  if (t < 14.4) return "Each column gets a specialist. No agent ever sees a real phone number.";
  if (t < 24.8) return "Every profile is fused into one generative recipe: 5,000 rows, zero real people.";
  if (t < 30.9) return "The Critic trusts no one, not even the other agents.";
  if (t < 35.8) return "Root cause: a Normal curve can't hold a heavy tail. Sent back to the Numeric agent.";
  if (t < 40.0) return "Privacy breach caught before release. Sent back to the Cohort agent.";
  return "Certified: faithful, private and fair. Ready for the report card.";
}

export const progress = (t: number, [a, b]: readonly [number, number]) => Math.min(1, Math.max(0, (t - a) / (b - a)));

const pct = (v: number, d = 0) => `${(v * 100).toFixed(d)}%`;

function check(checks: Check[], id: Check["id"]): Check {
  return checks.find((c) => c.id === id)!;
}

export interface Script {
  logs: LogEvent[];
  statuses: Record<AgentId, [number, Status][]>;
  synthSnippet: string;
}

export function buildScript(run: Run): Script {
  const p = run.profile;
  const [young, old] = p.age.comps;
  const naive = run.checks.naive;
  const mid = run.checks.mid;
  const corr = spearmanMatrix(run.real);
  const topScam = Object.entries(p.scam).sort((a, b) => b[1] - a[1])[0];
  const clipped = run.passes.naive.filter((r) => r.amount_lost_inr === 500).length / run.passes.naive.length;
  const amountKs = check(naive, "ks:amount_lost_inr");
  const drift = check(naive, "corr");
  const dup = run.nearDup.naive;
  const cohortShare = check(run.checks.final, "cohort").display;
  const failsNaive = naive.filter((c) => !c.pass).length;

  const L = (t: number, agent: AgentId, text: string, tone: Tone = "info"): LogEvent => ({ t, agent, text, tone });

  const logs: LogEvent[] = [
    L(0.2, "orchestrator", "Reading scam_victim_reports_india.csv · 240 rows × 12 columns"),
    L(3.6, "orchestrator", "Schema: 4 numeric · 4 categorical · 1 boolean · 1 text · 2 PII"),
    L(T.dispatch, "orchestrator", "Dispatching 8 specialist agents"),

    L(4.5, "pii", "Intercepting victim_name, phone_number before any agent reads them"),
    L(6.5, "pii", "Tokenizing 480 values into format-preserving fakes"),
    L(8.4, "pii", "Real PII forwarded to generators: 0", "ok"),

    L(4.8, "numeric", "Profiling 4 numeric columns"),
    L(6.4, "numeric", `victim_age: two peaks (${young.mean.toFixed(0)} & ${old.mean.toFixed(0)}) → Gaussian mixture, k=2`),
    L(8.2, "numeric", `hours_to_report: right-skewed, median ${p.hours.median}h → log-normal`),
    L(10.0, "numeric", `call_duration_min: rises with age (ρ ${p.call.rhoAge.toFixed(2)}) → conditional regression`),
    L(11.8, "numeric", `amount_lost_inr: Normal(μ ${formatInr(p.amount.naive.mean)}, σ ${formatInr(p.amount.naive.sd)}) · fast first pass`),
    L(32.4, "numeric", "Repair: refitting amount_lost_inr as log-normal per scam_type", "warn"),
    L(33.8, "numeric", `KS ${amountKs.display} → ${check(mid, "ks:amount_lost_inr").display} · amount ↔ call link restored`, "ok"),

    L(5.0, "categorical", "Profiling 4 categorical columns"),
    L(6.8, "categorical", `scam_type: 6 classes · top is ${topScam[0]} (${pct(topScam[1])})`),
    L(8.6, "categorical", `channel: Telegram is rare (${pct(p.channel.Telegram, 1)}) → protected from smoothing`),
    L(10.4, "categorical", `language ↔ state: Cramér's V ${p.languageStateV.toFixed(2)} → conditional sampling`),
    L(12.0, "categorical", "Category tables locked", "ok"),

    L(5.2, "correlation", "Building a 5×5 rank-correlation map"),
    L(8.0, "correlation", `age ↔ call_duration  ρ ${corr[0][3].toFixed(2)}`),
    L(10.0, "correlation", `amount ↔ call_duration  ρ ${corr[1][3].toFixed(2)} (via scam_type)`),
    L(12.0, "correlation", `hours ↔ recovered  ρ ${corr[2][4].toFixed(2)} · golden-hour effect`),
    L(13.2, "correlation", `Recovered: ${pct(p.recoveryByBucket[0])} if reported < 2h vs ${pct(p.recoveryByBucket[3])} after 24h`, "ok"),

    L(5.4, "text", "Reading 240 scam message snippets"),
    L(7.6, "text", "6 templates: urgency + authority impersonation"),
    L(9.6, "text", `${pct(p.text.hinglishShare)} code-mixed Hinglish → style preserved`),
    L(11.4, "text", "Writing paraphrased snippets · zero verbatim reuse", "ok"),

    L(5.8, "cohort", "Scanning for under-represented groups"),
    L(7.8, "cohort", `65+ & regional language: ${p.cohort.count} rows (${pct(p.cohort.share, 1)})`),
    L(9.6, "cohort", `Boost ×2 → +${run.passes.boost} rows by duplicating exemplars`),
    L(37.3, "cohort", "Repair: root cause is exemplar duplication", "warn"),
    L(38.4, "cohort", "Resampling cohort from the fitted model (age ≥ 65 · regional state)"),
    L(39.2, "cohort", `Near-copies ${dup.count} → 0 · cohort share kept at ${cohortShare}`, "ok"),

    L(4.6, "synth", "Waiting on 6 profiles"),
    L(T.synthStart, "synth", "Fusing 6 profiles into one generative recipe"),
    L(15.2, "synth", "Sampling 5,000 rows"),
    L(T.synthDone, "synth", "5,000 rows synthesized · handing to Critic", "ok"),
    L(34.0, "synth", "Re-synthesized amount_lost_inr for 5,000 rows"),
    L(38.6, "synth", `Re-synthesized ${run.passes.boost} cohort rows`),

    L(T.criticStart, "critic", "Running 12 checks across fidelity, privacy and fairness"),
    L(T.firstGrade, "critic", `${failsNaive} checks failed · grade C`, "fail"),
    L(30.9, "critic", `amount_lost_inr KS ${amountKs.display}: ${pct(clipped)} of losses clipped at ₹500. A Normal can't hold a heavy tail`, "fail"),
    L(31.2, "critic", `Correlation drift ${drift.display} has the same root cause → sending to Numeric`, "warn"),
    L(T.regrade1, "critic", `Re-check: KS ${check(mid, "ks:amount_lost_inr").display} ✓ · drift ${check(mid, "corr").display} ✓ · grade B+`, "ok"),
    L(35.8, "critic", `Privacy: ${dup.count} rows are near-copies of ${dup.victims} real victims (DCR < 0.05)`, "fail"),
    L(36.1, "critic", "Re-identifiable via age + state + language + amount → sending to Cohort", "warn"),
    L(T.regrade2, "critic", "Full re-run: 12/12 checks passed · grade A", "ok"),

    L(T.certify, "orchestrator", "All checks green · synthetic twin certified", "ok"),
  ];
  logs.sort((a, b) => a.t - b.t);

  const W = T.windows;
  const statuses: Record<AgentId, [number, Status][]> = {
    orchestrator: [[0, "working"], [T.certify, "done"]],
    pii: [[W.pii[0], "working"], [W.pii[1], "done"]],
    numeric: [[W.numeric[0], "working"], [W.numeric[1], "done"], [T.repair1[0], "repairing"], [T.repair1[1], "done"]],
    categorical: [[W.categorical[0], "working"], [W.categorical[1], "done"]],
    correlation: [[W.correlation[0], "working"], [W.correlation[1], "done"]],
    text: [[W.text[0], "working"], [W.text[1], "done"]],
    cohort: [[W.cohort[0], "working"], [W.cohort[1], "done"], [T.repair2[0], "repairing"], [T.repair2[1], "done"]],
    synth: [[4.6, "waiting"], [T.synthStart, "working"], [T.synthDone, "done"], [T.repair1[0], "working"], [T.repair1[1], "done"], [T.repair2[0], "working"], [T.repair2[1], "done"]],
    critic: [[4.6, "waiting"], [T.criticStart, "auditing"], [T.regrade2, "done"]],
  };

  const synthSnippet = run.passes.final.find((r) => r.scam_type === "Digital Arrest" && /[a-z]+ mein/.test(r.scam_message_snippet))?.scam_message_snippet
    ?? run.passes.final[0].scam_message_snippet;

  return { logs, statuses, synthSnippet };
}

export function statusAt(script: Script, agent: AgentId, t: number): Status {
  let s: Status = "queued";
  for (const [at, status] of script.statuses[agent]) if (t >= at) s = status;
  return s;
}

export function logsUpTo(script: Script, t: number, agent?: AgentId): LogEvent[] {
  return script.logs.filter((l) => l.t <= t && (!agent || l.agent === agent));
}

// Which synthetic pass is "live" at time t.
export function passAt(t: number): "naive" | "mid" | "final" {
  if (t >= T.passFinal) return "final";
  if (t >= T.passMid) return "mid";
  return "naive";
}

// Which check results the Critic is showing at time t.
export function checksAt(run: Run, t: number): Check[] {
  if (t >= T.regrade2) return run.checks.final;
  if (t >= T.regrade1) return run.checks.mid;
  return run.checks.naive;
}

export function gradeFor(checks: Check[]): "A" | "B+" | "C" {
  const fails = checks.filter((c) => !c.pass).length;
  return fails === 0 ? "A" : fails === 1 ? "B+" : "C";
}

export const typed = (text: string, since: number, t: number, cps = 70) =>
  text.slice(0, Math.max(0, Math.floor((t - since) * cps)));

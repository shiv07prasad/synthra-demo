import { AnimatePresence, motion } from "motion/react";
import { Check, CornerUpLeft, RotateCcw, X } from "lucide-react";
import { Bars, Meter } from "../viz";
import { checksAt, gradeFor, passAt, progress, T } from "../../../theatre/timeline";
import type { Viz } from "../../../theatre/derive";
import type { CheckId, Pillar, Run } from "../../../engine/run";

// ---------- Synthesizer ----------

const DEPENDENCIES = [
  { label: "PII", at: T.windows.pii[1] },
  { label: "Cohort", at: T.windows.cohort[1] },
  { label: "Categ.", at: T.windows.categorical[1] },
  { label: "Numeric", at: T.windows.numeric[1] },
  { label: "Correl.", at: T.windows.correlation[1] },
  { label: "Text", at: T.windows.text[1] },
];

export function SynthViz({ t, viz, boost }: { t: number; viz: Viz; boost: number }) {
  const rows = Math.floor(progress(t, T.rows) * 5000);
  const pass = passAt(t);
  const note =
    t >= T.repair2[0] && t < T.repair2[1]
      ? `↻ re-sampling ${boost} cohort rows`
      : t >= T.repair1[0] && t < T.repair1[1]
        ? "↻ re-sampling amount_lost_inr"
        : null;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1">
        {DEPENDENCIES.map((d) => {
          const ok = t >= d.at;
          return (
            <span
              key={d.label}
              className={`flex items-center gap-1 rounded border px-1.5 py-px font-mono text-[9.5px] transition-colors duration-300 ${
                ok ? "border-green-200 bg-green-50 text-green-700" : "border-line bg-[#f7f7f7] text-ink-mute"
              }`}
            >
              {ok ? <Check className="size-2.5" strokeWidth={3} /> : <span className="size-2.5 rounded-full border border-current" />}
              {d.label}
            </span>
          );
        })}
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[20px] font-medium tabular-nums tracking-tight text-ink">
            {rows.toLocaleString("en-IN")}
            <span className="text-[13px] text-ink-mute"> / 5,000</span>
          </span>
          <span className="font-mono text-[9.5px] text-amber-700">{note}</span>
        </div>
        <div className="mt-1">
          <Meter value={rows / 5000} color="#818cf8" />
        </div>
      </div>

      <div>
        <div className="mb-0.5 flex items-center justify-between font-mono text-[9.5px] text-ink-mute">
          <span>amount_lost_inr · log</span>
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-[#d4d4d8]" />real</span>
            <span className="flex items-center gap-1"><span className="h-0.5 w-2.5 bg-[#6366f1]" />synthetic</span>
          </span>
        </div>
        <Bars values={viz.hist.amount_lost_inr} compare={t >= T.rows[0] + 1 ? viz.synthAmount[pass] : undefined} height={36} compareColor={pass === "naive" ? "#e11d48" : "#6366f1"} />
      </div>
    </div>
  );
}

// ---------- Critic ----------

const PILLAR_DOT: Record<Pillar, string> = { Fidelity: "bg-blue-400", Privacy: "bg-rose-400", Fairness: "bg-green-400" };

const REPAIRS: { ids: CheckId[]; to: string; from: number; until: number }[] = [
  { ids: ["ks:amount_lost_inr", "corr"], to: "Numeric", from: T.beam1[0], until: T.regrade1 },
  { ids: ["dcr"], to: "Cohort", from: T.beam2[0], until: T.regrade2 },
];

const GRADE_STYLE = {
  A: "border-green-500 text-green-600 bg-green-50",
  "B+": "border-amber-500 text-amber-600 bg-amber-50",
  C: "border-rose-500 text-rose-600 bg-rose-50",
};

export function CriticViz({ t, run }: { t: number; run: Run }) {
  const checks = checksAt(run, t);
  const naive = run.checks.naive;
  const revealed = checks.map((_, i) => t >= T.checkReveal(i));
  const shown = revealed.filter(Boolean).length;
  const passed = checks.filter((c, i) => revealed[i] && c.pass).length;
  const grade = t >= T.firstGrade ? gradeFor(checks) : null;

  if (t < T.criticStart) {
    return (
      <div className="flex h-full flex-col gap-1.5">
        <p className="font-mono text-[10.5px] text-ink-mute">Waiting for 5,000 synthetic rows…</p>
        {naive.map((c) => (
          <div key={c.id} className="h-[25px] rounded-md bg-[#f6f6f6]" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10.5px] text-ink-mute">
            {passed}/{checks.length} passed · {shown < checks.length ? "running…" : "suite complete"}
          </p>
          <div className="mt-1.5 flex gap-[3px]">
            {checks.map((c, i) => (
              <span
                key={c.id}
                className={`h-2 flex-1 rounded-[2px] transition-colors duration-300 ${
                  !revealed[i] ? "bg-[#ececec]" : c.pass ? "bg-green-400" : "bg-rose-400"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="relative size-[54px] shrink-0">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={grade ?? "pending"}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className={`absolute inset-0 grid place-items-center rounded-full border-2 text-[22px] font-semibold tracking-tight ${
                grade ? GRADE_STYLE[grade] : "border-dashed border-[#d4d4d4] text-[13px] text-ink-mute"
              }`}
            >
              {grade ?? "…"}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        {checks.map((c, i) => {
          if (!revealed[i]) return <div key={c.id} className="h-[25px] rounded-md bg-[#f6f6f6]" />;
          const before = naive[i];
          const repaired = !before.pass && c.pass;
          const repair = REPAIRS.find((r) => r.ids.includes(c.id) && t >= r.from && t < r.until);
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex h-[25px] items-center gap-2 rounded-md px-2 font-mono text-[10.5px] transition-colors duration-300 ${
                c.pass ? (repaired ? "bg-green-50" : "bg-[#f8f8f8]") : "bg-rose-50"
              }`}
            >
              <span className={`size-1.5 shrink-0 rounded-full ${PILLAR_DOT[c.pillar]}`} />
              <span className="min-w-0 flex-1 truncate text-ink">
                {c.test} <span className="text-ink-mute">· {c.target}</span>
              </span>
              {repair && (
                <span className="flex shrink-0 items-center gap-0.5 rounded bg-amber-100 px-1 text-[9.5px] text-amber-800">
                  <CornerUpLeft className="size-2.5" />
                  {repair.to}
                </span>
              )}
              <span className={`shrink-0 tabular-nums ${c.pass ? "text-ink-soft" : "font-medium text-rose-700"}`}>
                {repaired ? (
                  <>
                    <span className="text-rose-400 line-through">{before.display}</span> <span className="text-green-700">{c.display}</span>
                  </>
                ) : (
                  c.display
                )}
              </span>
              <span className="w-[46px] shrink-0 text-right text-ink-mute">{c.threshold}</span>
              {c.pass ? (
                <Check className="size-3.5 shrink-0 text-green-600" strokeWidth={3} />
              ) : repair ? (
                <RotateCcw className="size-3.5 shrink-0 animate-spin text-amber-600 [animation-direction:reverse] [animation-duration:1.4s]" />
              ) : (
                <X className="size-3.5 shrink-0 text-rose-600" strokeWidth={3} />
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-auto flex items-center gap-3 pt-3 font-mono text-[9.5px] text-ink-mute">
        {(["Fidelity", "Privacy", "Fairness"] as Pillar[]).map((p) => (
          <span key={p} className="flex items-center gap-1">
            <span className={`size-1.5 rounded-full ${PILLAR_DOT[p]}`} />
            {p}
          </span>
        ))}
        <span className="ml-auto">computed live in your browser</span>
      </div>
    </div>
  );
}

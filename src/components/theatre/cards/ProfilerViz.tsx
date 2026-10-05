import type { ReactNode } from "react";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { Bars } from "../viz";
import { progress, typed } from "../../../theatre/timeline";
import type { Viz } from "../../../theatre/derive";
import type { Run } from "../../../engine/run";
import { CORR_LABELS } from "../../../engine/metrics";
import { SCAM_TYPES } from "../../../data/schema";

type Props = { t: number; viz: Viz; run: Run };

const Chip = ({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ok" | "warn" | "fail" }) => {
  const cls = {
    neutral: "border-line bg-[#f6f6f6] text-ink-soft",
    ok: "border-green-200 bg-green-50 text-green-700",
    warn: "border-amber-200 bg-amber-50 text-amber-700",
    fail: "border-rose-200 bg-rose-50 text-rose-700",
  }[tone];
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-px font-mono text-[9.5px] leading-4 ${cls}`}>{children}</span>;
};

// ---------- Numeric ----------

export function NumericViz({ t, viz }: Props) {
  const amountFit =
    t >= 33.8 ? <Chip tone="ok">log-normal ✓</Chip> : t >= 30.9 ? <Chip tone="fail"><TriangleAlert className="size-2.5" />Normal · underfit</Chip> : t >= 11.8 ? <Chip>Normal</Chip> : null;

  const cells = [
    { key: "victim_age", label: "victim_age", win: [4.8, 6.4], fit: t >= 6.4 && <Chip>GMM k=2</Chip> },
    { key: "hours_to_report", label: "hours · log", win: [6.4, 8.2], fit: t >= 8.2 && <Chip>log-normal</Chip> },
    { key: "call_duration_min", label: "call_duration", win: [8.2, 10.0], fit: t >= 10.0 && <Chip>regression</Chip> },
    { key: "amount_lost_inr", label: "amount · log", win: [10.0, 11.8], fit: amountFit },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
      {cells.map((c) => (
        <div key={c.key} className={c.key === "amount_lost_inr" && t >= 30.9 && t < 33.8 ? "rounded-md bg-rose-50/70 p-0.5" : "p-0.5"}>
          <div className="mb-0.5 flex items-center justify-between gap-1">
            <span className="truncate font-mono text-[9.5px] text-ink-mute">{c.label}</span>
            {c.fit}
          </div>
          <Bars values={viz.hist[c.key]} reveal={progress(t, c.win)} height={26} fill={c.key === "amount_lost_inr" ? "#93c5fd" : "#d4d4d8"} />
        </div>
      ))}
    </div>
  );
}

// ---------- Categorical ----------

export function CategoricalViz({ t, viz, run }: Props) {
  const scamReveal = progress(t, [5.0, 6.8]);
  const channelReveal = progress(t, [6.8, 8.6]);
  const channelColors = ["#a1a1aa", "#c4b5fd", "#d4d4d8", "#fb923c"];

  return (
    <div className="space-y-2">
      <div className="space-y-[3px]">
        {viz.scamShares.map(([label, share], i) => {
          const grow = Math.min(1, Math.max(0, scamReveal * SCAM_TYPES.length - i));
          return (
            <div key={label} className="flex items-center gap-2 font-mono text-[9.5px] text-ink-soft">
              <span className="w-[76px] shrink-0 truncate">{label}</span>
              <div className="h-[7px] flex-1 rounded-sm bg-[#f2f2f2]">
                <div className="h-full rounded-sm bg-[#c4b5fd]" style={{ width: `${(share / viz.scamShares[0][1]) * 100 * grow}%` }} />
              </div>
              <span className="w-7 text-right">{grow > 0 ? `${Math.round(share * 100)}%` : ""}</span>
            </div>
          );
        })}
      </div>
      <div>
        <div className="flex h-2 overflow-hidden rounded-sm bg-[#f2f2f2]">
          {viz.channelShares.map(([label, share], i) => (
            <div key={label} style={{ width: `${share * 100 * channelReveal}%`, background: channelColors[i] }} />
          ))}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {t >= 8.6 && <Chip tone="warn">Telegram {(run.profile.channel.Telegram * 100).toFixed(1)}% · rare</Chip>}
          {t >= 10.4 && <Chip>lang↔state V {run.profile.languageStateV.toFixed(2)}</Chip>}
        </div>
      </div>
    </div>
  );
}

// ---------- Correlation ----------

const HIGHLIGHTS: [number, number, number][] = [
  [0, 3, 8.0],
  [1, 3, 10.0],
  [2, 4, 12.0],
];

export function CorrelationViz({ t, viz, run }: Props) {
  const reveal = progress(t, [5.2, 12.0]) * 25;
  const rec = run.profile.recoveryByBucket;

  return (
    <div className="flex gap-3">
      <div className="grid shrink-0 grid-cols-[30px_repeat(5,19px)] gap-[2px] font-mono text-[8.5px] text-ink-mute">
        {viz.corr.map((row, i) => (
          <div key={i} className="contents">
            <span className="flex items-center justify-end pr-1">{CORR_LABELS[i]}</span>
            {row.map((v, j) => {
              const idx = i * 5 + j;
              const on = reveal > idx;
              const hl = HIGHLIGHTS.some(([a, b, at]) => t >= at && ((a === i && b === j) || (a === j && b === i)));
              const bg = i === j ? "#e5e5e5" : v >= 0 ? `rgba(59,130,246,${Math.abs(v) * 0.9 + 0.06})` : `rgba(244,63,94,${Math.abs(v) * 0.9 + 0.06})`;
              return (
                <span
                  key={j}
                  className={`grid size-[19px] place-items-center rounded-[3px] text-[7.5px] transition-opacity duration-300 ${hl ? "ring-2 ring-ink" : ""}`}
                  style={{ background: on ? bg : "#f4f4f4", color: Math.abs(v) > 0.35 && i !== j ? "#fff" : "#a3a3a3", opacity: on ? 1 : 0.6 }}
                >
                  {on && i !== j && Math.abs(v) > 0.35 ? v.toFixed(1).replace("0.", ".") : ""}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-end gap-1.5 pb-0.5">
        <p className="font-mono text-[9.5px] leading-tight text-ink-mute">golden hour · recovered</p>
        {[
          { label: "< 2h", v: rec[0] },
          { label: "> 24h", v: rec[3] },
        ].map((b) => (
          <div key={b.label} className="flex items-center gap-1.5 font-mono text-[9.5px] text-ink-soft">
            <span className="w-8 shrink-0">{b.label}</span>
            <div className="h-[7px] flex-1 rounded-sm bg-[#f2f2f2]">
              <div className="h-full rounded-sm bg-teal-400 transition-[width] duration-500" style={{ width: t >= 13.2 ? `${b.v * 100}%` : "0%" }} />
            </div>
            <span className="w-7 text-right">{t >= 13.2 ? `${Math.round(b.v * 100)}%` : ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Text ----------

const SHORT: Record<string, string> = {
  "UPI Collect": "UPI",
  "KYC Update": "KYC",
  "Task Job": "Task",
  Investment: "Invest",
  "Digital Arrest": "Arrest",
  Lottery: "Lottery",
};

export function TextViz({ t, snippet, hinglishShare }: { t: number; snippet: string; hinglishShare: number }) {
  const lit = progress(t, [5.4, 7.6]) * 6;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {SCAM_TYPES.map((s, i) => (
          <span
            key={s}
            className={`rounded border px-1.5 py-px font-mono text-[9.5px] transition-colors duration-300 ${
              lit > i ? "border-amber-200 bg-amber-50 text-amber-700" : "border-line bg-[#f7f7f7] text-ink-mute"
            }`}
          >
            {SHORT[s]}
          </span>
        ))}
        {t >= 9.6 && (
          <span className="rounded border border-line bg-[#f6f6f6] px-1.5 py-px font-mono text-[9.5px] text-ink-soft">Hinglish {Math.round(hinglishShare * 100)}%</span>
        )}
      </div>
      <div className="relative h-[54px] overflow-hidden rounded-md bg-panel px-2.5 py-2 font-mono text-[10px] leading-snug text-white/75">
        {t < 11.4 ? (
          <span className="text-white/30">learning tone, urgency & code-mixing…</span>
        ) : (
          <>
            <span className="mr-1 rounded bg-white/10 px-1 text-[8.5px] uppercase tracking-wider text-amber-300">synthetic</span>
            {typed(snippet, 11.6, t, 40)}
            <span className="ml-px inline-block h-[1em] w-px translate-y-[2px] bg-white/70 [animation:caret-blink_1s_step-end_infinite]" />
          </>
        )}
      </div>
    </div>
  );
}

// ---------- PII Guard ----------

export function PiiViz({ t, viz }: Props) {
  const tokenized = Math.round(progress(t, [5.0, 8.2]) * 480);
  return (
    <div className="space-y-1.5">
      {viz.piiPairs.map(({ real, fake }, i) => {
        const done = t >= 5.2 + i * 0.9;
        return (
          <div key={i} className="flex items-center gap-1.5 font-mono text-[9.5px]">
            <span className={`w-[104px] shrink-0 truncate rounded px-1 py-px ${done ? "text-rose-400 line-through" : "bg-rose-50 text-rose-700"}`}>
              {real.phone_number}
            </span>
            <ArrowRight className={`size-3 shrink-0 ${done ? "text-ink-mute" : "text-transparent"}`} />
            <span className={`truncate rounded px-1 py-px transition-opacity duration-300 ${done ? "bg-green-50 text-green-700 opacity-100" : "opacity-0"}`}>
              {fake.phone_number}
            </span>
          </div>
        );
      })}
      <div className="flex items-end justify-between pt-1">
        <div>
          <p className="font-mono text-[9.5px] text-ink-mute">tokenized</p>
          <p className="font-mono text-[15px] font-medium tabular-nums text-ink">{tokenized}<span className="text-ink-mute">/480</span></p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[9.5px] text-ink-mute">real PII to generators</p>
          <p className="font-mono text-[15px] font-semibold text-green-600">0</p>
        </div>
      </div>
    </div>
  );
}

// ---------- Cohort ----------

export function CohortViz({ t, run }: Props) {
  const p = run.profile;
  const boosted = run.checks.final.find((c) => c.id === "cohort")!.value;
  const strategy =
    t >= 38.4 ? (
      <Chip tone="ok">model sampling ✓</Chip>
    ) : t >= 35.8 ? (
      <Chip tone="fail"><TriangleAlert className="size-2.5" />duplication leaks identities</Chip>
    ) : t >= 9.6 ? (
      <Chip>strategy: duplicate exemplars</Chip>
    ) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-[26px] font-semibold leading-none tracking-tight text-ink tabular-nums">{t >= 7.8 ? p.cohort.count : "–"}</span>
        <span className="font-mono text-[10px] leading-tight text-ink-mute">
          victims aged 65+
          <br />
          reporting in a regional language
        </span>
      </div>
      {[
        { label: "real", v: p.cohort.share, show: t >= 7.8, color: "#a3a3a3" },
        { label: "target", v: boosted, show: t >= 9.6, color: "#4ade80" },
      ].map((b) => (
        <div key={b.label} className="flex items-center gap-1.5 font-mono text-[9.5px] text-ink-soft">
          <span className="w-9 shrink-0">{b.label}</span>
          <div className="h-[7px] flex-1 rounded-sm bg-[#f2f2f2]">
            <div className="h-full rounded-sm transition-[width] duration-700" style={{ width: b.show ? `${(b.v / 0.07) * 100}%` : "0%", background: b.color }} />
          </div>
          <span className="w-8 text-right">{b.show ? `${(b.v * 100).toFixed(1)}%` : ""}</span>
        </div>
      ))}
      <div className="h-4">{strategy}</div>
    </div>
  );
}

export { Chip };

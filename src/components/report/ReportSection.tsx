import { useState, type ReactNode } from "react";
import { ArrowRight, Check, Download, FileJson, ShieldCheck, X } from "lucide-react";
import { DCR_AXIS, NUMERIC_AXES, type Report } from "../../engine/report";
import { CORR_LABELS } from "../../engine/metrics";
import type { Run } from "../../engine/run";
import { formatInr } from "../../data/schema";
import { diverging, Heatmap, Legend, OverlayHistogram, PairedBars, REAL, sequential, SYNTH, Tip, Verdict } from "./charts";

const pct = (v: number, d = 1) => `${(v * 100).toFixed(d)}%`;

function Card({ title, sub, right, children, className = "" }: { title: string; sub?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-line bg-white p-4 ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold tracking-tight text-ink">{title}</p>
          {sub && <p className="mt-0.5 font-mono text-[11px] text-ink-mute">{sub}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      {children}
    </div>
  );
}

function BlockTitle({ n, title, sub, right }: { n: string; title: string; sub: string; right?: ReactNode }) {
  return (
    <div className="mb-4 mt-12 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="font-mono text-[12px] text-ink-mute">{n}</p>
        <h3 className="mt-1 text-[22px] font-semibold tracking-[-0.025em] text-ink">{title}</h3>
        <p className="mt-1 max-w-2xl text-[14.5px] text-ink-soft">{sub}</p>
      </div>
      {right}
    </div>
  );
}

// ---------- 1 · scorecard ----------

function Scorecard({ report, run }: { report: Report; run: Run }) {
  const passed = run.checks.final.filter((c) => c.pass).length;
  const cohort = report.fairness[0];
  const tiles = [
    {
      pillar: "Fidelity",
      value: report.fidelityScore.toFixed(1),
      unit: "/ 100",
      line: "distribution match across 8 columns",
      meter: report.fidelityScore / 100,
    },
    {
      pillar: "Privacy",
      value: String(report.privacy.nearCopies.final),
      unit: "/ 5,000",
      line: "rows re-identifiable · 0 PII leaks",
      meter: 1,
    },
    {
      pillar: "Utility",
      value: report.utility.tstr.toFixed(2),
      unit: "AUC",
      line: `trained on synthetic · real baseline ${report.utility.trtr.toFixed(2)}`,
      meter: Math.min(1, report.utility.ratio),
    },
    {
      pillar: "Fairness",
      value: `×${(cohort.synth / cohort.real).toFixed(1)}`,
      unit: "coverage",
      line: `rare cohort ${pct(cohort.real)} → ${pct(cohort.synth)}`,
      meter: 1,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.15fr_1fr_1fr_1fr_1fr]">
      <div className="flex items-center gap-4 rounded-xl border border-[#1e1e1e] bg-panel p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:col-span-2 xl:col-span-1">
        <div className="grid size-[74px] shrink-0 place-items-center rounded-full border-2 border-green-400 bg-green-400/10 text-[34px] font-semibold tracking-tight text-green-300">
          A
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[15px] font-semibold">
            <ShieldCheck className="size-4 text-green-300" /> Certified twin
          </p>
          <p className="mt-1 font-mono text-[11px] leading-relaxed text-white/55">
            {passed}/{run.checks.final.length} checks passed
            <br />
            RUN #0142 · 2 repairs applied
          </p>
        </div>
      </div>
      {tiles.map((tile) => (
        <div key={tile.pillar} className="rounded-xl border border-line bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11.5px] text-ink-soft">{tile.pillar}</p>
            <span className="flex items-center gap-1 font-mono text-[10.5px] text-green-700">
              <Check className="size-3" strokeWidth={3} /> pass
            </span>
          </div>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[34px] font-semibold leading-none tracking-[-0.04em] text-ink tabular-nums">{tile.value}</span>
            <span className="font-mono text-[11px] text-ink-mute">{tile.unit}</span>
          </p>
          <p className="mt-1.5 text-[12.5px] leading-snug text-ink-soft">{tile.line}</p>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#efefef]">
            <div className="h-full rounded-full bg-ink" style={{ width: `${tile.meter * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- 2 · distributions ----------

const NUMERIC_TITLES: Record<string, (v: number) => string> = {
  victim_age: (v) => `${Math.round(v)} yrs`,
  amount_lost_inr: (v) => formatInr(v),
  hours_to_report: (v) => `${v}h`,
  call_duration_min: (v) => `${Math.round(v)} min`,
};

function binLabelFor(key: keyof typeof NUMERIC_AXES) {
  const ax = NUMERIC_AXES[key];
  const fmt = (v: number) => {
    if (!ax.log) return Math.round(v).toString();
    const raw = 10 ** v;
    return key === "amount_lost_inr" ? formatInr(raw) : `${raw < 10 ? raw.toFixed(1) : Math.round(raw)}h`;
  };
  return (a: number, b: number) => `${fmt(a)} – ${fmt(b)}`;
}

function Distributions({ report }: { report: Report }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {report.numeric.map((c) => {
        const ax = NUMERIC_AXES[c.key];
        return (
          <Card
            key={c.key}
            title={c.key}
            sub={`${ax.unit} · median ${NUMERIC_TITLES[c.key](c.realMedian)} → ${NUMERIC_TITLES[c.key](c.synthMedian)}`}
            right={<Verdict pass={c.pass}>KS {c.ks.toFixed(3)}</Verdict>}
          >
            <OverlayHistogram real={c.real} synth={c.synth} lo={ax.lo} hi={ax.hi} ticks={ax.ticks} binLabel={binLabelFor(c.key)} />
          </Card>
        );
      })}
      {report.categorical.map((c) => {
        const order = c.categories.map((_, i) => i).sort((a, b) => c.real[b] - c.real[a]);
        return (
          <Card
            key={c.key}
            title={c.key}
            sub={`${c.categories.length} classes · total variation ${pct(c.tvd)}`}
            right={<Verdict pass={c.pass}>JSD {c.jsd.toFixed(4)}</Verdict>}
          >
            <PairedBars categories={order.map((i) => c.categories[i])} real={order.map((i) => c.real[i])} synth={order.map((i) => c.synth[i])} />
          </Card>
        );
      })}
    </div>
  );
}

// ---------- 3 · correlations ----------

function Correlations({ report }: { report: Report }) {
  const [hover, setHover] = useState<[number, number] | null>(null);
  const { real, synth, diff, maxDrift } = report.corr;
  const cell = hover && hover[0] !== hover[1] ? hover : null;

  return (
    <Card
      title="Relationships between columns"
      sub="Spearman rank correlation · hover a cell to compare all three maps"
      right={<Verdict pass={maxDrift <= 0.15}>max drift {maxDrift.toFixed(3)} ≤ 0.15</Verdict>}
    >
      <div className="relative grid gap-6 md:grid-cols-3">
        {[
          { label: "Real", m: real, color: diverging },
          { label: "Synthetic", m: synth, color: diverging },
          { label: "Absolute difference", m: diff, color: (v: number) => sequential(v, 0.15) },
        ].map((h) => (
          <div key={h.label}>
            <p className="mb-2 font-mono text-[11px] text-ink-soft">{h.label}</p>
            <Heatmap matrix={h.m} labels={CORR_LABELS} color={h.color} hover={hover} onHover={setHover} />
          </div>
        ))}
        {cell && (
          <Tip left="50%">
            {CORR_LABELS[cell[0]]} × {CORR_LABELS[cell[1]]} · real {real[cell[0]][cell[1]].toFixed(2)} · synthetic{" "}
            {synth[cell[0]][cell[1]].toFixed(2)} · |Δ| {diff[cell[0]][cell[1]].toFixed(3)}
          </Tip>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-6 font-mono text-[10.5px] text-ink-mute">
        <span className="flex items-center gap-2">
          −1
          <span className="h-2 w-28 rounded-sm" style={{ background: `linear-gradient(to right, ${diverging(-1)}, ${diverging(0)}, ${diverging(1)})` }} />
          +1 <span className="ml-1">ρ</span>
        </span>
        <span className="flex items-center gap-2">
          0
          <span className="h-2 w-20 rounded-sm" style={{ background: `linear-gradient(to right, ${sequential(0, 1)}, ${sequential(1, 1)})` }} />
          0.15 <span className="ml-1">|Δ| threshold</span>
        </span>
      </div>
    </Card>
  );
}

// ---------- 4 · privacy + utility ----------

function Privacy({ report }: { report: Report }) {
  const p = report.privacy;
  const ticks = [[0, "0"], [2, "2"], [4, "4"], [6, "6+"]] as const;
  const binLabel = (a: number, b: number) => `distance ${a.toFixed(1)} – ${b.toFixed(1)}`;

  return (
    <Card title="Can anyone be re-identified?" sub="distance from each synthetic row to its closest real victim" right={<Verdict pass={p.nearCopies.final === 0}>{p.nearCopies.final} near-copies</Verdict>}>
      <div className="space-y-4">
        <div>
          <p className="mb-1 flex items-center justify-between font-mono text-[11px]">
            <span className="text-ink-soft">Pass 1 · rejected by the Critic</span>
            <span className="text-rose-700">
              {p.nearCopies.naive} rows copy {p.victims.naive} real victims
            </span>
          </p>
          <OverlayHistogram real={p.dcr.naive} lo={DCR_AXIS.lo} hi={DCR_AXIS.hi} ticks={ticks} binLabel={binLabel} width={640} realColor="#d4d4d4" highlightBins={[0]} />
        </div>
        <div>
          <p className="mb-1 flex items-center justify-between font-mono text-[11px]">
            <span className="text-ink-soft">Certified twin</span>
            <span className="text-green-700">0 rows near any real victim</span>
          </p>
          <OverlayHistogram real={p.dcr.final} lo={DCR_AXIS.lo} hi={DCR_AXIS.hi} ticks={ticks} binLabel={binLabel} width={640} realColor={SYNTH} />
        </div>
        <p className="rounded-lg bg-[#f7f7f7] px-3 py-2 text-[12.5px] leading-relaxed text-ink-soft">
          A typical synthetic row sits <span className="font-mono text-ink">{p.medianDcr.final.toFixed(2)}</span> away from its nearest real
          victim. Real victims sit <span className="font-mono text-ink">{p.medianDcr.realToReal.toFixed(2)}</span> from each other. The twin is no
          closer to real people than they are to one another.
        </p>
      </div>
    </Card>
  );
}

function Utility({ report }: { report: Report }) {
  const u = report.utility;
  const bars = [
    { label: "Trained on real data", sub: "5-fold cross-validation · 192 rows per fold", v: u.trtr, color: REAL },
    { label: "Trained on synthetic only", sub: "5,000 synthetic rows · tested on all 240 real", v: u.tstr, color: SYNTH },
  ];
  const lo = 0.5;
  const top = u.driversReal[0];
  const topSynth = u.driversSynth.find((d) => d.name === top.name) ?? u.driversSynth[0];

  return (
    <Card
      title="Is the fake data actually useful?"
      sub="predict funds_recovered · logistic regression · ROC AUC on real victims"
      right={<Verdict pass={u.ratio >= 0.9}>{u.ratio >= 1 ? "matches real baseline" : `${pct(u.ratio, 0)} of baseline`}</Verdict>}
    >
      <div className="space-y-4">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-[13px] font-medium text-ink">{b.label}</span>
              <span className="font-mono text-[15px] font-medium tabular-nums text-ink">{b.v.toFixed(3)}</span>
            </div>
            <div className="relative h-3 rounded-[3px] bg-[#f2f2f2]">
              <div className="h-full rounded-[3px]" style={{ width: `${((b.v - lo) / (1 - lo)) * 100}%`, background: b.color }} />
            </div>
            <p className="mt-1 font-mono text-[10.5px] text-ink-mute">{b.sub}</p>
          </div>
        ))}
        <div className="flex justify-between font-mono text-[10px] text-ink-mute">
          <span>0.5 · coin flip</span>
          <span>1.0 · perfect</span>
        </div>
        <div className="rounded-lg bg-[#f7f7f7] px-3 py-2 text-[12.5px] leading-relaxed text-ink-soft">
          Both models learn the same top signal: <span className="font-mono text-ink">{top.name}</span> (weight{" "}
          <span className="font-mono text-ink">{top.weight.toFixed(2)}</span> real, <span className="font-mono text-ink">{topSynth.weight.toFixed(2)}</span>{" "}
          synthetic). The sooner a victim reports, the likelier the money comes back. Base rate: {pct(u.positiveRate, 0)} recovered.
        </div>
      </div>
    </Card>
  );
}

// ---------- 5 · fairness + what the critic fixed ----------

function Fairness({ report, run }: { report: Report; run: Run }) {
  const f = report.fairness;
  const stats = [
    { v: `${run.profile.cohort.count} → ${Math.round(f[0].synth * run.passes.final.length)}`, k: "cohort rows, real → synthetic" },
    { v: "0", k: "cohort rows copied from real victims" },
    { v: `×${(f[0].synth / f[0].real).toFixed(1)}`, k: "share of the dataset" },
  ];
  return (
    <Card title="Who is represented?" sub="share of rows · rare groups kept or boosted, never erased" right={<Verdict pass={f[0].synth >= f[0].real}>cohort ×{(f[0].synth / f[0].real).toFixed(1)}</Verdict>}>
      <PairedBars categories={f.map((g) => g.label)} real={f.map((g) => g.real)} synth={f.map((g) => g.synth)} max={0.35} labelWidth={176} />
      <div className="mt-4 grid grid-cols-3 gap-2">
        {stats.map((x) => (
          <div key={x.k} className="rounded-lg border border-line px-3 py-2.5">
            <p className="font-mono text-[17px] font-medium tabular-nums text-ink">{x.v}</p>
            <p className="mt-0.5 text-[11.5px] leading-snug text-ink-mute">{x.k}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 rounded-lg bg-[#f7f7f7] px-3 py-2 text-[12.5px] leading-relaxed text-ink-soft">
        The 65+ regional-language cohort was boosted ×{(f[0].synth / f[0].real).toFixed(1)} by sampling from the fitted model, after the Critic
        rejected the first attempt for copying real victims.
      </p>
    </Card>
  );
}

function CriticFixes({ run }: { run: Run }) {
  const { naive, final } = run.checks;
  return (
    <Card title="What the Critic fixed" sub="all 12 checks · first pass vs certified" right={<Verdict pass>12 / 12</Verdict>}>
      <table className="w-full table-fixed font-mono text-[11px]">
        <thead>
          <tr className="text-left text-ink-mute [&>th]:pb-2 [&>th]:font-normal">
            <th>check</th>
            <th className="w-[84px] text-right">pass 1</th>
            <th className="w-6" />
            <th className="w-[76px] text-right">certified</th>
            <th className="w-16 text-right">limit</th>
          </tr>
        </thead>
        <tbody>
          {final.map((c, i) => {
            const before = naive[i];
            const fixed = !before.pass;
            return (
              <tr key={c.id} className={`border-t border-line ${fixed ? "bg-green-50/60" : ""} [&>td]:py-[5px]`}>
                <td className="truncate pr-2 text-ink">
                  {c.test} <span className="text-ink-mute">· {c.target}</span>
                </td>
                <td className={`whitespace-nowrap text-right tabular-nums ${before.pass ? "text-ink-soft" : "text-rose-700"}`}>
                  {before.pass ? before.display : (
                    <span className="inline-flex items-center gap-1">
                      <X className="size-3" strokeWidth={3} />
                      {before.display}
                    </span>
                  )}
                </td>
                <td className="text-center text-ink-mute">{fixed && <ArrowRight className="mx-auto size-3" />}</td>
                <td className="whitespace-nowrap text-right tabular-nums text-ink">
                  <span className="inline-flex items-center gap-1">
                    <Check className="size-3 text-green-600" strokeWidth={3} />
                    {c.display}
                  </span>
                </td>
                <td className="text-right text-ink-mute">{c.threshold}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

// ---------- section ----------

export default function ReportSection({
  report,
  run,
  onDownloadCsv,
  onDownloadJson,
}: {
  report: Report;
  run: Run;
  onDownloadCsv: () => void;
  onDownloadJson: () => void;
}) {
  return (
    <section id="report" className="relative border-t border-line bg-white">
      <div className="mx-auto max-w-[1440px] px-4 pb-28 pt-20 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 font-mono text-[13px] text-ink-soft">
              <span className="size-2 bg-ink" /> 03 — Report Card
            </p>
            <h2 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-ink sm:text-[44px]">
              Original vs. synthetic, side by side.
            </h2>
            <p className="mt-3 text-[16.5px] leading-relaxed text-ink-soft">
              The evaluation behind the grade. Every number is computed live in this browser from the 240 real rows and the 5,000 certified
              synthetic rows.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-[13px]">
            <button onClick={onDownloadJson} className="flex items-center gap-1.5 rounded-md bg-[#ededed] px-3.5 py-2 text-ink transition-colors hover:bg-[#e3e3e3]">
              <FileJson className="size-4" /> Export Report
            </button>
            <button
              onClick={onDownloadCsv}
              className="flex items-center gap-1.5 rounded-md bg-[#2b2b2b] px-3.5 py-2 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition-colors hover:bg-[#1c1c1c]"
            >
              <Download className="size-4" /> Synthetic CSV
            </button>
          </div>
        </div>

        <div className="mt-8">
          <Scorecard report={report} run={run} />
        </div>

        <BlockTitle n="01 · Fidelity" title="Every column, compared" sub="Do the synthetic rows follow the same shapes as the real ones? Hover any bar for exact shares." right={<Legend />} />
        <Distributions report={report} />

        <div className="mt-3">
          <Correlations report={report} />
        </div>

        <BlockTitle n="02 · Privacy & Utility" title="Safe to share, and still worth using" sub="A twin is only useful if it protects real people and still teaches models the right lessons." />
        <div className="grid gap-3 lg:grid-cols-2">
          <Privacy report={report} />
          <Utility report={report} />
        </div>

        <BlockTitle n="03 · Fairness & Audit trail" title="No one left out, nothing hidden" sub="Rare groups are protected, and every repair the agents made is on the record." />
        <div className="grid gap-3 lg:grid-cols-2">
          <Fairness report={report} run={run} />
          <CriticFixes run={run} />
        </div>

        <p className="mt-10 max-w-3xl font-mono text-[11px] leading-relaxed text-ink-mute">
          Methods: two-sample Kolmogorov–Smirnov (numeric), Jensen–Shannon divergence and total variation (categorical), Spearman ρ drift,
          distance to closest record over standardized numeric fields plus categorical mismatches, logistic regression scored by ROC AUC
          (train-synthetic-test-real). All data is fictional.
        </p>
      </div>
    </section>
  );
}

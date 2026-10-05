import { useState, type ReactNode } from "react";
import { Check, X } from "lucide-react";

// Series identity for the whole report: real data is the grey baseline, synthetic is the
// emphasized blue. Diverging correlations use blue ↔ red around a neutral gray.
export const REAL = "#b9b9b9";
export const SYNTH = "#2a78d6";
const POS = [42, 120, 214];
const NEG = [227, 73, 72];
const MID = [240, 239, 236];
const ORANGE = [235, 104, 52];

const mix = (a: number[], b: number[], k: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(",")})`;
export const diverging = (v: number) => mix(MID, v >= 0 ? POS : NEG, Math.min(1, Math.abs(v)));
export const sequential = (v: number, max: number) => mix(MID, ORANGE, Math.min(1, v / max));

export function Legend() {
  return (
    <div className="flex items-center gap-4 font-mono text-[11px] text-ink-soft">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-3 rounded-[2px]" style={{ background: REAL }} /> Real (240 rows)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-0.5 w-3.5 rounded-full" style={{ background: SYNTH }} /> Synthetic (5,000 rows)
      </span>
    </div>
  );
}

export function Verdict({ pass, children }: { pass: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-px font-mono text-[10.5px] ${
        pass ? "border-green-200 bg-green-50 text-green-700" : "border-rose-200 bg-rose-50 text-rose-700"
      }`}
    >
      {pass ? <Check className="size-3" strokeWidth={3} /> : <X className="size-3" strokeWidth={3} />}
      {children}
    </span>
  );
}

export function Tip({ left, children }: { left: string; children: ReactNode }) {
  return (
    <div
      className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 -translate-y-[calc(100%+6px)] whitespace-nowrap rounded-md bg-panel px-2 py-1 font-mono text-[10.5px] leading-relaxed text-white shadow-lg"
      style={{ left }}
    >
      {children}
    </div>
  );
}

const pct = (v: number, d = 1) => `${(v * 100).toFixed(d)}%`;

// ---------- overlaid histogram: real bars + synthetic step line ----------

const H = 132;
const PAD = { l: 6, r: 6, t: 8, b: 22 };

export function OverlayHistogram({
  real,
  synth,
  lo,
  hi,
  ticks,
  binLabel,
  realColor = REAL,
  synthColor = SYNTH,
  highlightBins = [],
  width: W = 320,
}: {
  real: number[];
  synth?: number[];
  lo: number;
  hi: number;
  ticks: readonly (readonly [number, string])[];
  binLabel: (a: number, b: number) => string;
  realColor?: string;
  synthColor?: string;
  highlightBins?: number[];
  width?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const n = real.length;
  const pw = W - PAD.l - PAD.r;
  const ph = H - PAD.t - PAD.b;
  const max = Math.max(...real, ...(synth ?? [])) || 1;
  const bw = pw / n;
  const x = (v: number) => PAD.l + ((v - lo) / (hi - lo)) * pw;
  const y = (v: number) => PAD.t + ph - (v / max) * ph;
  const step = (hi - lo) / n;

  const line = synth
    ? synth.map((v, i) => `${i === 0 ? `M${PAD.l} ${y(0)} V${y(v)}` : `V${y(v)}`} H${PAD.l + (i + 1) * bw}`).join(" ") + ` V${y(0)}`
    : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" onMouseLeave={() => setHover(null)}>
        <line x1={PAD.l} x2={W - PAD.r} y1={y(0)} y2={y(0)} stroke="#e5e5e5" />
        {real.map((v, i) => {
          const h = y(0) - y(v);
          return (
            <rect
              key={i}
              x={PAD.l + i * bw + 1}
              y={y(v)}
              width={Math.max(0, bw - 2)}
              height={h}
              rx={Math.min(2, h / 2)}
              fill={highlightBins.includes(i) ? "#e34948" : realColor}
              opacity={hover === null || hover === i ? 1 : 0.55}
            />
          );
        })}
        {line && <path d={line} fill="none" stroke={synthColor} strokeWidth={2} strokeLinejoin="round" />}
        {ticks.map(([v, label]) => (
          <g key={label}>
            <line x1={x(v)} x2={x(v)} y1={y(0)} y2={y(0) + 4} stroke="#d4d4d4" />
            <text x={x(v)} y={H - 6} textAnchor="middle" className="fill-ink-mute font-mono text-[10px]">
              {label}
            </text>
          </g>
        ))}
        {real.map((_, i) => (
          <rect key={i} x={PAD.l + i * bw} y={PAD.t} width={bw} height={ph} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
      </svg>
      {hover !== null && (
        <Tip left={`${((PAD.l + (hover + 0.5) * bw) / W) * 100}%`}>
          <span className="text-white/60">{binLabel(lo + hover * step, lo + (hover + 1) * step)}</span>
          <br />
          real {pct(real[hover])}
          {synth && <> · synthetic {pct(synth[hover])}</>}
        </Tip>
      )}
    </div>
  );
}

// ---------- paired horizontal bars: real vs synthetic share per category ----------

export function PairedBars({
  categories,
  real,
  synth,
  max,
  labelWidth = 92,
}: {
  categories: string[];
  real: number[];
  synth: number[];
  max?: number;
  labelWidth?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const top = max ?? Math.max(...real, ...synth);

  return (
    <div className="space-y-[7px]" onMouseLeave={() => setHover(null)}>
      {categories.map((c, i) => (
        <div key={c} className="relative flex items-center gap-2" onMouseEnter={() => setHover(i)}>
          <span className="shrink-0 truncate font-mono text-[10.5px] text-ink-soft" style={{ width: labelWidth }}>
            {c}
          </span>
          <div className="flex-1 space-y-[2px]">
            <div className="h-[5px] rounded-r-[2px]" style={{ width: `${(real[i] / top) * 100}%`, background: REAL }} />
            <div className="h-[5px] rounded-r-[2px]" style={{ width: `${(synth[i] / top) * 100}%`, background: SYNTH }} />
          </div>
          <span className="w-10 shrink-0 text-right font-mono text-[10.5px] tabular-nums text-ink-soft">{pct(synth[i], 0)}</span>
          {hover === i && (
            <Tip left="60%">
              {c}: real {pct(real[i])} · synthetic {pct(synth[i])}
            </Tip>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------- correlation heatmap ----------

export function Heatmap({
  matrix,
  labels,
  color,
  hover,
  onHover,
  format = (v: number) => v.toFixed(2),
}: {
  matrix: number[][];
  labels: string[];
  color: (v: number) => string;
  hover: [number, number] | null;
  onHover: (cell: [number, number] | null) => void;
  format?: (v: number) => string;
}) {
  return (
    <div className="grid max-w-[300px] grid-cols-[46px_repeat(5,minmax(0,1fr))] gap-[2px]" onMouseLeave={() => onHover(null)}>
      {matrix.map((row, i) => (
        <div key={i} className="contents">
          <span className="flex items-center justify-end pr-1.5 font-mono text-[10px] text-ink-mute">{labels[i]}</span>
          {row.map((v, j) => {
            const on = hover && ((hover[0] === i && hover[1] === j) || (hover[0] === j && hover[1] === i));
            const strong = Math.abs(v) > 0.45;
            return (
              <span
                key={j}
                onMouseEnter={() => onHover([i, j])}
                className={`grid aspect-square place-items-center rounded-[3px] font-mono text-[10px] transition-shadow ${on ? "ring-2 ring-ink" : ""}`}
                style={{ background: i === j ? "#e7e7e7" : color(v), color: i === j ? "#a3a3a3" : strong ? "#fff" : "#525252" }}
              >
                {i === j ? "" : format(v)}
              </span>
            );
          })}
        </div>
      ))}
      <span />
      {labels.map((l) => (
        <span key={l} className="truncate pt-1 text-center font-mono text-[10px] text-ink-mute">
          {l}
        </span>
      ))}
    </div>
  );
}

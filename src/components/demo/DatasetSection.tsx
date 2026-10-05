import { memo } from "react";
import { LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import { COLUMNS, type ColumnKind, type ScamRecord } from "../../data/schema";
import { T } from "../../theatre/timeline";
import { GlowLayers, Shimmer } from "../Glow";
import type { Profile } from "../../engine/synthesize";

const KIND_STYLE: Record<ColumnKind, string> = {
  NUM: "border-blue-200 bg-blue-50 text-blue-700",
  CAT: "border-violet-200 bg-violet-50 text-violet-700",
  BOOL: "border-slate-200 bg-slate-100 text-slate-700",
  TEXT: "border-amber-200 bg-amber-50 text-amber-700",
  PII: "border-rose-200 bg-rose-50 text-rose-700",
};

const inr = (v: number) => `₹${v.toLocaleString("en-IN")}`;

function cell(row: ScamRecord, key: keyof ScamRecord) {
  const v = row[key];
  if (key === "amount_lost_inr") return inr(v as number);
  if (key === "hours_to_report") return `${v}h`;
  if (key === "call_duration_min") return `${v} min`;
  if (key === "funds_recovered") return v ? "yes" : "no";
  return String(v);
}

const DatasetTable = memo(function DatasetTable({ rows, stamped }: { rows: ScamRecord[]; stamped: number }) {
  return (
    <table className="w-full min-w-[1480px] border-separate border-spacing-0 text-left">
      <thead className="sticky top-0 z-10 bg-white">
        <tr>
          <th className="w-12 border-b border-line px-3 py-2.5 font-mono text-[11px] font-normal text-ink-mute">#</th>
          {COLUMNS.map((c, i) => (
            <th key={c.key} className="border-b border-line px-3 py-2.5 font-normal">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11.5px] text-ink">{c.key}</span>
                {i < stamped && (
                  <span className={`rounded border px-1 font-mono text-[9px] leading-4 [animation:stamp_0.35s_cubic-bezier(0.2,1.4,0.4,1)] ${KIND_STYLE[c.kind]}`}>
                    {c.kind}
                  </span>
                )}
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r} className="group">
            <td className="border-b border-line px-3 py-2 font-mono text-[11px] text-ink-mute group-hover:bg-[#fafafa]">{r + 1}</td>
            {COLUMNS.map((c, i) => {
              const pii = c.kind === "PII" && i < stamped;
              return (
                <td
                  key={c.key}
                  className={`border-b border-line px-3 py-2 text-[12.5px] transition-colors duration-500 group-hover:bg-[#fafafa] ${
                    c.kind === "NUM" || c.kind === "PII" || c.kind === "BOOL" ? "font-mono text-[11.5px]" : ""
                  } ${c.kind === "TEXT" ? "max-w-[340px] truncate text-ink-soft" : "whitespace-nowrap text-ink"} ${
                    pii ? "!bg-rose-50/70 text-rose-700" : ""
                  }`}
                >
                  {cell(row, c.key)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
});

function GenerateButton({
  running,
  finished,
  onGenerate,
  compact = false,
}: {
  running: boolean;
  finished: boolean;
  onGenerate: () => void;
  compact?: boolean;
}) {
  return (
    <button onClick={onGenerate} disabled={running} className="group relative isolate inline-flex rounded-[10px] p-[1.5px] disabled:cursor-default">
      <GlowLayers active={!running} />
      <span
        className={`relative flex items-center gap-2.5 overflow-hidden rounded-[8.5px] font-mono text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_14px_30px_-12px_rgba(0,0,0,0.45)] transition-colors ${
          compact ? "px-5 py-2.5 text-[14px]" : "px-6 py-3.5 text-[15px]"
        } ${running ? "bg-[#3a3a3a]" : "bg-[#2b2b2b] group-hover:bg-[#1c1c1c]"}`}
      >
        {running ? (
          <>
            <LoaderCircle className="size-4 animate-spin" /> Agents running…
          </>
        ) : finished ? (
          <>
            <RotateCcw className="size-4" /> Run Again
          </>
        ) : (
          <>
            <Sparkles className="size-4 transition-transform group-hover:rotate-12" /> Generate Dataset
          </>
        )}
        <Shimmer active={!running} />
      </span>
    </button>
  );
}

export default function DatasetSection({
  rows,
  profile,
  t,
  running,
  finished,
  onGenerate,
}: {
  rows: ScamRecord[];
  profile: Profile;
  t: number;
  running: boolean;
  finished: boolean;
  onGenerate: () => void;
}) {
  const stamped = t < 0 ? 0 : COLUMNS.filter((_, i) => t >= T.stamp(i)).length;
  const scanning = t >= 0 && t < T.scanEnd;
  const scanX = Math.min(1, Math.max(0, t / T.scanEnd));

  const stats = [
    { k: "rows", v: rows.length.toString() },
    { k: "columns", v: COLUMNS.length.toString() },
    { k: "PII fields", v: "2" },
    { k: "rare-cohort victims", v: `${profile.cohort.count} · ${(profile.cohort.share * 100).toFixed(1)}%` },
  ];

  return (
    <section id="dataset" className="relative border-t border-line bg-white">
      <div className="mx-auto max-w-[1440px] px-4 pb-20 pt-20 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 font-mono text-[13px] text-ink-soft">
              <span className="size-2 bg-ink" /> 01 — The Dataset
            </p>
            <h2 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-ink sm:text-[44px]">
              240 scam victims. Too sensitive to share.
            </h2>
            <p className="mt-3 text-[16.5px] leading-relaxed text-ink-soft">
              Complaint records modelled on India's cyber-fraud reports. Every row is a person: their age, their losses,
              their phone number. Under the DPDP Act, this data can't leave the building.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <GenerateButton running={running} finished={finished} onGenerate={onGenerate} compact />
            <div className="flex flex-wrap gap-2">
              {stats.map((s) => (
                <div key={s.k} className="rounded-lg border border-line bg-[#fafafa] px-3 py-2">
                  <p className="font-mono text-[15px] font-medium text-ink">{s.v}</p>
                  <p className="font-mono text-[10.5px] text-ink-mute">{s.k}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[14px] border border-[#dcdce2] bg-white shadow-[0_24px_50px_-34px_rgba(0,0,0,0.4)]">
          <div
            className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-2.5"
            style={{ background: "linear-gradient(100deg, #f6f6f8 0%, #efeef3 60%, #e4e1ef 100%)" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-[#d4d4d8]" />
                <span className="size-2.5 rounded-full bg-[#d4d4d8]" />
                <span className="size-2.5 rounded-full bg-[#d4d4d8]" />
              </div>
              <span className="font-mono text-[12.5px] text-ink">scam_victim_reports_india.csv</span>
              <span className="rounded border border-amber-200 bg-amber-50 px-1.5 font-mono text-[10px] text-amber-700">
                fictional sample data
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(Object.keys(KIND_STYLE) as ColumnKind[]).map((k) => (
                <span key={k} className={`rounded border px-1 font-mono text-[9.5px] leading-4 ${KIND_STYLE[k]}`}>
                  {k}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="h-[440px] overflow-auto">
              <DatasetTable rows={rows} stamped={stamped} />
            </div>
            {scanning && (
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                  className="absolute inset-y-0 w-40 -translate-x-full"
                  style={{
                    left: `${scanX * 100}%`,
                    background: "linear-gradient(to right, transparent, rgba(129,140,248,0.16))",
                  }}
                />
                <div className="absolute inset-y-0 w-px bg-indigo-400 shadow-[0_0_12px_2px_rgba(129,140,248,0.6)]" style={{ left: `${scanX * 100}%` }} />
                <span
                  className="absolute top-3 ml-2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 font-mono text-[10px] text-white"
                  style={{ left: `${Math.min(scanX, 0.86) * 100}%` }}
                >
                  orchestrator · reading schema
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <GenerateButton running={running} finished={finished} onGenerate={onGenerate} />
          <p className="font-mono text-[12px] text-ink-mute">8 agents · 5,000 synthetic rows · privacy: strict</p>
        </div>
      </div>
    </section>
  );
}

import type { ReactNode, Ref } from "react";
import { Check } from "lucide-react";
import { AGENTS } from "./agents";
import { typed, type AgentId, type LogEvent, type Status, type Tone } from "../../theatre/timeline";

const STATUS_STYLE: Record<Status, { label: string; dot: string; pulse: boolean }> = {
  queued: { label: "Queued", dot: "bg-[#c9c9c9]", pulse: false },
  waiting: { label: "Waiting", dot: "bg-[#c9c9c9]", pulse: false },
  working: { label: "Working", dot: "bg-blue-500", pulse: true },
  auditing: { label: "Auditing", dot: "bg-orange-500", pulse: true },
  repairing: { label: "Repairing", dot: "bg-amber-500", pulse: true },
  done: { label: "Done", dot: "bg-signal", pulse: false },
};

export const TONE_TEXT: Record<Tone, string> = {
  info: "text-ink-soft",
  ok: "text-green-700",
  warn: "text-amber-700",
  fail: "text-rose-700",
};

export function StatusPill({ status }: { status: Status }) {
  const s = STATUS_STYLE[status];
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-line bg-white px-2 py-0.5 font-mono text-[10.5px] text-ink-soft">
      {status === "done" ? (
        <Check className="size-3 text-green-600" strokeWidth={3} />
      ) : (
        <span className="relative flex size-1.5">
          {s.pulse && <span className={`absolute inset-0 rounded-full ${s.dot} [animation:signal-ping_1.4s_ease-out_infinite]`} />}
          <span className={`relative size-1.5 rounded-full ${s.dot}`} />
        </span>
      )}
      {s.label}
    </span>
  );
}

export default function AgentCard({
  agent,
  status,
  logs,
  t,
  className = "",
  ref,
  children,
}: {
  agent: AgentId;
  status: Status;
  logs: LogEvent[];
  t: number;
  className?: string;
  ref?: Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  const meta = AGENTS[agent];
  const Icon = meta.icon;
  const recent = logs.slice(-2);

  const frame =
    status === "repairing"
      ? "border-amber-300 ring-4 ring-amber-100"
      : status === "working" || status === "auditing"
        ? "border-[#d6d6d6] shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]"
        : "border-line";

  return (
    <div
      ref={ref}
      className={`relative flex flex-col rounded-xl border bg-white p-2.5 transition-[box-shadow,border-color,opacity] duration-300 ${frame} ${
        status === "queued" ? "opacity-55" : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="grid size-7 shrink-0 place-items-center rounded-md border border-line bg-[#f6f6f6]"
            style={{ color: meta.color }}
          >
            <Icon className="size-4" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13.5px] font-semibold tracking-tight text-ink">{meta.name}</p>
            <p className="truncate font-mono text-[10.5px] text-ink-mute">{meta.role}</p>
          </div>
        </div>
        <StatusPill status={status} />
      </div>

      <div className="mt-2 min-h-0 flex-1">{children}</div>

      <div className="mt-1.5 h-[34px] space-y-0.5 border-t border-dashed border-line pt-1.5 font-mono text-[10.5px] leading-snug">
        {recent.length === 0 && <p className="text-ink-mute">idle</p>}
        {recent.map((l, i) => {
          const latest = i === recent.length - 1;
          return (
            <p key={l.t} className={`truncate ${latest ? TONE_TEXT[l.tone] : "text-ink-mute"}`}>
              <span className="text-ink-mute">›</span> {latest ? typed(l.text, l.t, t, 90) : l.text}
            </p>
          );
        })}
      </div>
    </div>
  );
}

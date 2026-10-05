import { useEffect, useRef } from "react";
import { AGENTS } from "./agents";
import { logsUpTo, type Script, type Tone } from "../../theatre/timeline";

const TONE: Record<Tone, string> = {
  info: "text-white/70",
  ok: "text-green-300",
  warn: "text-amber-300",
  fail: "text-rose-300",
};

const stamp = (s: number) => {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${(s - m * 60).toFixed(1).padStart(4, "0")}`;
};

export default function EventStream({ t, script, playing }: { t: number; script: Script; playing: boolean }) {
  const logs = logsUpTo(script, t);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs.length]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[#1e1e1e] bg-panel shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <div className="flex items-center justify-between border-b border-panel-line px-3 py-2">
        <span className="font-mono text-[11px] text-white/80">event stream</span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-white/45">
          <span className={`size-1.5 rounded-full ${playing ? "bg-signal [animation:signal-ping_1.4s_ease-out_infinite]" : "bg-white/30"}`} />
          {logs.length} events
        </span>
      </div>
      <div ref={listRef} className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-2 font-mono text-[10.5px] leading-snug [scrollbar-width:thin]">
        {logs.map((l) => (
          <p key={`${l.agent}-${l.t}`} className="flex gap-2">
            <span className="shrink-0 text-white/30 tabular-nums">{stamp(l.t)}</span>
            <span className="w-[54px] shrink-0 truncate" style={{ color: AGENTS[l.agent].color }}>
              {AGENTS[l.agent].short}
            </span>
            <span className={TONE[l.tone]}>{l.text}</span>
          </p>
        ))}
        <span className="inline-block h-3 w-1.5 translate-y-0.5 bg-white/60 [animation:caret-blink_1s_step-end_infinite]" />
      </div>
    </div>
  );
}

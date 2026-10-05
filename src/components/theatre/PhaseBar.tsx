import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, Download, Pause, Play, RotateCcw, ShieldCheck } from "lucide-react";
import { captionAt, PHASES, progress } from "../../theatre/timeline";
import type { Clock } from "../../theatre/useClock";

const clockText = (s: number) => {
  const v = Math.max(0, s);
  const m = Math.floor(v / 60);
  return `${String(m).padStart(2, "0")}:${(v - m * 60).toFixed(1).padStart(4, "0")}`;
};

export default function PhaseBar({
  clock,
  onReplay,
  onDownload,
  leaked,
}: {
  clock: Clock;
  onReplay: () => void;
  onDownload: () => void;
  leaked: number;
}) {
  const { t, playing, speed, finished } = clock;
  const caption = captionAt(t);

  return (
    <div className="sticky top-3 z-30 rounded-xl border border-line bg-white/90 shadow-[0_8px_30px_-20px_rgba(0,0,0,0.35)] backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2">
        <div className="flex items-center gap-2 font-mono text-[12px] text-ink">
          <span className="relative flex size-2">
            {playing && <span className="absolute inset-0 rounded-full bg-signal [animation:signal-ping_1.4s_ease-out_infinite]" />}
            <span className={`relative size-2 rounded-full ${finished ? "bg-signal" : playing ? "bg-signal" : "bg-[#c4c4c4]"}`} />
          </span>
          RUN #0142
        </div>

        <div className="flex min-w-[280px] flex-1 items-center gap-2">
          {PHASES.map((p) => {
            const v = progress(t, [p.start, p.end]);
            const active = v > 0 && v < 1;
            return (
              <div key={p.label} className="flex-1">
                <div className={`mb-1 font-mono text-[10.5px] ${active ? "text-ink" : v >= 1 ? "text-ink-soft" : "text-ink-mute"}`}>
                  {p.label}
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-[#ececec]">
                  <div className="h-full rounded-full bg-ink transition-[width] duration-100" style={{ width: `${v * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[12px]">
          <span className="w-[62px] text-right tabular-nums text-ink">{clockText(t)}</span>
          <button
            onClick={clock.cycleSpeed}
            className="h-7 w-10 rounded-md border border-line bg-white text-ink-soft transition-colors hover:bg-[#f4f4f4]"
            aria-label="Change playback speed"
          >
            {speed}×
          </button>
          <button
            onClick={clock.toggle}
            disabled={finished}
            className="grid size-7 place-items-center rounded-md border border-line bg-white text-ink transition-colors hover:bg-[#f4f4f4] disabled:opacity-40"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </button>
          <button
            onClick={onReplay}
            className="grid size-7 place-items-center rounded-md border border-line bg-white text-ink transition-colors hover:bg-[#f4f4f4]"
            aria-label="Replay"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="border-t border-line px-4 py-2">
        <AnimatePresence mode="wait" initial={false}>
          {finished ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <p className="flex items-center gap-2 text-[14px] text-ink">
                <ShieldCheck className="size-4 text-green-600" />
                <span className="font-semibold">Synthetic twin certified</span>
                <span className="font-mono text-[12px] text-ink-soft">· 5,000 rows · 12/12 checks · {leaked} real records leaked</span>
              </p>
              <div className="flex items-center gap-2 font-mono text-[12.5px]">
                <button
                  onClick={onDownload}
                  className="flex items-center gap-1.5 rounded-md bg-[#ededed] px-3 py-1.5 text-ink transition-colors hover:bg-[#e3e3e3]"
                >
                  <Download className="size-3.5" /> Download CSV
                </button>
                <a
                  href="#report"
                  className="flex items-center gap-1.5 rounded-md bg-[#2b2b2b] px-3 py-1.5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition-colors hover:bg-[#1c1c1c]"
                >
                  View Report Card <ArrowDown className="size-3.5" />
                </a>
              </div>
            </motion.div>
          ) : (
            <motion.p
              key={caption}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="text-[14px] text-ink-soft"
            >
              {caption}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

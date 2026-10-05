import { useEffect, useState, type RefObject } from "react";
import { progress, T } from "../../theatre/timeline";

type Pt = { x: number; y: number };
type Geometry = { critic: Pt; numeric: Pt; cohort: Pt } | null;

const BEAMS = [
  { window: T.beam1, to: "numeric" as const, label: "repair request → Numeric" },
  { window: T.beam2, to: "cohort" as const, label: "repair request → Cohort" },
];

// Draws the Critic's "send it back" packet as an arc from the Critic card to the agent at fault.
export default function RepairBeam({
  t,
  container,
  critic,
  numeric,
  cohort,
}: {
  t: number;
  container: RefObject<HTMLDivElement | null>;
  critic: RefObject<HTMLDivElement | null>;
  numeric: RefObject<HTMLDivElement | null>;
  cohort: RefObject<HTMLDivElement | null>;
}) {
  const [geo, setGeo] = useState<Geometry>(null);

  // A passive effect: the container is this component's parent, and React attaches a parent's ref
  // only after its children's layout effects have run.
  useEffect(() => {
    const box = container.current;
    if (!box) return;
    const measure = () => {
      const base = box.getBoundingClientRect();
      const rel = (el: HTMLDivElement | null, at: "left" | "center"): Pt | null => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: (at === "left" ? r.left + 2 : r.left + r.width / 2) - base.left, y: r.top + r.height * 0.42 - base.top };
      };
      const c = rel(critic.current, "left");
      const n = rel(numeric.current, "center");
      const h = rel(cohort.current, "center");
      setGeo(c && n && h ? { critic: { ...c, y: c.y - 60 }, numeric: n, cohort: h } : null);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  }, [container, critic, numeric, cohort]);

  if (!geo) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 hidden xl:block">
      {BEAMS.map((b) => {
        const [start, end] = b.window;
        if (t < start || t > end + 0.6) return null;
        const p = progress(t, b.window);
        const fade = t > end ? 1 - (t - end) / 0.6 : 1;
        const from = geo.critic;
        const to = geo[b.to];
        const lift = Math.min(from.y, to.y) - 70;
        const d = `M ${from.x} ${from.y} C ${from.x - 60} ${lift}, ${to.x + 60} ${lift}, ${to.x} ${to.y}`;
        return (
          <div key={b.to} className="absolute inset-0" style={{ opacity: fade }}>
            <svg className="absolute inset-0 h-full w-full overflow-visible">
              <path d={d} fill="none" stroke="#fde68a" strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} />
              <path d={d} fill="none" stroke="#f59e0b" strokeWidth={1.75} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} />
            </svg>
            <div
              className="absolute left-0 top-0"
              style={{ offsetPath: `path("${d}")`, offsetDistance: `${p * 100}%`, offsetRotate: "0deg" }}
            >
              <span className="block size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-amber-500 shadow-[0_0_0_6px_rgba(245,158,11,0.25)]" />
              <span className="absolute left-3 top-[-22px] whitespace-nowrap rounded bg-amber-500 px-1.5 py-0.5 font-mono text-[10px] text-white shadow">
                {b.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

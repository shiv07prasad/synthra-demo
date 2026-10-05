import { AGENTS, DISPATCH_ORDER } from "./agents";
import { StatusPill } from "./AgentCard";
import { logsUpTo, statusAt, T, typed, type Script } from "../../theatre/timeline";

export default function OrchestratorBar({ t, script, className = "" }: { t: number; script: Script; className?: string }) {
  const latest = logsUpTo(script, t, "orchestrator").at(-1);
  const Icon = AGENTS.orchestrator.icon;
  const flowing = t >= T.dispatch && t < 14.4;

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-white px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-[#2b2b2b] text-white">
            <Icon className="size-4" strokeWidth={2.2} />
          </span>
          <span className="text-[13.5px] font-semibold tracking-tight text-ink">Orchestrator</span>
          <StatusPill status={statusAt(script, "orchestrator", t)} />
        </div>
        <p className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-soft">
          {latest ? typed(latest.text, latest.t, t, 80) : ""}
        </p>
        <div className="flex flex-wrap gap-1">
          {DISPATCH_ORDER.map((id, i) => {
            const on = t >= T.dispatch + i * 0.08;
            return (
              <span
                key={id}
                className={`flex items-center gap-1 rounded-full border px-1.5 py-px font-mono text-[9.5px] transition-all duration-300 ${
                  on ? "border-line bg-white text-ink-soft" : "border-transparent bg-[#f4f4f4] text-[#c4c4c4]"
                }`}
              >
                <span className="size-1.5 rounded-full" style={{ background: on ? AGENTS[id].color : "#d4d4d4" }} />
                {AGENTS[id].short}
              </span>
            );
          })}
        </div>
      </div>

      {/* Dispatch connectors down into the three agent columns */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-full hidden h-3 xl:block">
        {[1 / 6, 1 / 2, 5 / 6].map((x) => (
          <span
            key={x}
            className="absolute top-0 h-full w-px"
            style={{
              left: `${x * 100}%`,
              backgroundColor: flowing ? "transparent" : "#e5e5e5",
              backgroundImage: flowing ? "linear-gradient(to bottom, transparent, #818cf8, transparent)" : "none",
              backgroundSize: "100% 200%",
              animation: flowing ? "flow-down 0.9s linear infinite" : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}

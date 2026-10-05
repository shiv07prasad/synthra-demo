import { useRef, type RefObject } from "react";
import AgentCard from "./AgentCard";
import OrchestratorBar from "./OrchestratorBar";
import PhaseBar from "./PhaseBar";
import EventStream from "./EventStream";
import LiveRows from "./LiveRows";
import RepairBeam from "./RepairBeam";
import { CategoricalViz, CohortViz, CorrelationViz, NumericViz, PiiViz, TextViz } from "./cards/ProfilerViz";
import { CriticViz, SynthViz } from "./cards/SynthCriticViz";
import { logsUpTo, statusAt, type AgentId, type Script } from "../../theatre/timeline";
import type { Clock } from "../../theatre/useClock";
import type { Viz } from "../../theatre/derive";
import type { Run } from "../../engine/run";

export default function AgentTheatre({
  run,
  script,
  viz,
  clock,
  anchorRef,
  onReplay,
  onDownload,
}: {
  run: Run;
  script: Script;
  viz: Viz;
  clock: Clock;
  anchorRef: RefObject<HTMLDivElement | null>;
  onReplay: () => void;
  onDownload: () => void;
}) {
  const t = clock.t;
  const gridRef = useRef<HTMLDivElement>(null);
  const criticRef = useRef<HTMLDivElement>(null);
  const numericRef = useRef<HTMLDivElement>(null);
  const cohortRef = useRef<HTMLDivElement>(null);

  const card = (agent: AgentId) => ({
    agent,
    t,
    status: statusAt(script, agent, t),
    logs: logsUpTo(script, t, agent),
  });
  const vizProps = { t, viz, run };

  return (
    <section id="theatre" className="relative border-t border-line bg-[#fafafa]">
      <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-20 sm:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="flex items-center gap-2 font-mono text-[13px] text-ink-soft">
            <span className="size-2 bg-ink" /> 02 — Agent Theatre
          </p>
          <h2 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] text-ink sm:text-[44px]">
            Eight agents. One synthetic twin.
          </h2>
          <p className="mt-3 text-[16.5px] leading-relaxed text-ink-soft">
            Specialists profile the data, a Synthesizer fuses their work, and a Critic audits every row. It sends
            failures back until the twin is faithful, private and fair.
          </p>
        </div>

        <div ref={anchorRef} className="scroll-mt-3" />
        <PhaseBar clock={clock} onReplay={onReplay} onDownload={onDownload} leaked={run.nearDup.final.count} />

        <div
          ref={gridRef}
          className="relative mt-2.5 grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_400px]"
        >
          <OrchestratorBar t={t} script={script} className="md:col-span-2 xl:col-span-3 xl:row-start-1" />

          <AgentCard {...card("numeric")} ref={numericRef}>
            <NumericViz {...vizProps} />
          </AgentCard>
          <AgentCard {...card("categorical")}>
            <CategoricalViz {...vizProps} />
          </AgentCard>
          <AgentCard {...card("correlation")}>
            <CorrelationViz {...vizProps} />
          </AgentCard>
          <AgentCard {...card("text")}>
            <TextViz t={t} snippet={script.synthSnippet} hinglishShare={run.profile.text.hinglishShare} />
          </AgentCard>
          <AgentCard {...card("pii")}>
            <PiiViz {...vizProps} />
          </AgentCard>
          <AgentCard {...card("cohort")} ref={cohortRef}>
            <CohortViz {...vizProps} />
          </AgentCard>

          <AgentCard
            {...card("critic")}
            ref={criticRef}
            className="md:col-span-2 xl:col-span-1 xl:col-start-4 xl:row-span-3 xl:row-start-1"
          >
            <CriticViz t={t} run={run} />
          </AgentCard>

          <AgentCard {...card("synth")} className="md:col-span-2 xl:col-span-1">
            <SynthViz t={t} viz={viz} boost={run.passes.boost} />
          </AgentCard>
          <div className="md:col-span-2">
            <LiveRows t={t} run={run} viz={viz} />
          </div>
          <div className="relative min-h-[240px] md:col-span-2 xl:col-span-1">
            <div className="absolute inset-0">
              <EventStream t={t} script={script} playing={clock.playing} />
            </div>
          </div>

          <RepairBeam t={t} container={gridRef} critic={criticRef} numeric={numericRef} cohort={cohortRef} />
        </div>
      </div>
    </section>
  );
}

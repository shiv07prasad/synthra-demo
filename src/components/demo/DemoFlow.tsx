import { useEffect, useMemo, useRef, useState } from "react";
import DatasetSection from "./DatasetSection";
import AgentTheatre from "../theatre/AgentTheatre";
import ReportSection from "../report/ReportSection";
import { getRun, type Run } from "../../engine/run";
import { computeReport, type Report } from "../../engine/report";
import { buildScript, PHASES, T } from "../../theatre/timeline";
import { deriveViz } from "../../theatre/derive";
import { useClock } from "../../theatre/useClock";
import { COLUMNS, type ScamRecord } from "../../data/schema";

function saveFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  Object.assign(document.createElement("a"), { href: url, download: name }).click();
  URL.revokeObjectURL(url);
}

function downloadCsv(rows: ScamRecord[]) {
  const esc = (v: unknown) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = COLUMNS.map((c) => c.key).join(",");
  const body = rows.map((r) => COLUMNS.map((c) => esc(r[c.key])).join(",")).join("\n");
  saveFile("synthetic_scam_victim_reports_india.csv", `${header}\n${body}\n`, "text/csv");
}

function downloadReport(run: Run, report: Report) {
  const summary = {
    run: "RUN #0142",
    grade: "A",
    rows: { real: run.real.length, synthetic: run.passes.final.length },
    checks: { firstPass: run.checks.naive, certified: run.checks.final },
    fidelity: {
      score: report.fidelityScore,
      numeric: report.numeric.map(({ key, ks, realMedian, synthMedian }) => ({ key, ks, realMedian, synthMedian })),
      categorical: report.categorical.map(({ key, jsd, tvd }) => ({ key, jsd, tvd })),
      maxCorrelationDrift: report.corr.maxDrift,
    },
    privacy: {
      nearCopies: report.privacy.nearCopies,
      victimsExposed: report.privacy.victims,
      verbatimLeaks: report.privacy.leaks,
      medianDistanceToClosestRecord: report.privacy.medianDcr,
    },
    utility: { task: "predict funds_recovered", aucTrainRealCv: report.utility.trtr, aucTrainSyntheticTestReal: report.utility.tstr },
    fairness: report.fairness,
  };
  saveFile("synthra_report_card.json", JSON.stringify(summary, null, 2), "application/json");
}

export default function DemoFlow() {
  const run = useMemo(getRun, []);
  const script = useMemo(() => buildScript(run), [run]);
  const viz = useMemo(() => deriveViz(run), [run]);
  const clock = useClock(T.end);
  const anchorRef = useRef<HTMLDivElement>(null);
  const scrolled = useRef(false);
  const [report, setReport] = useState<Report | null>(null);
  const [revealed, setRevealed] = useState(false);

  // The report's privacy and utility maths takes ~0.5s, so do it while the visitor reads the hero.
  useEffect(() => {
    const id = setTimeout(() => setReport(computeReport(run)), 600);
    return () => clearTimeout(id);
  }, [run]);

  // Once the show has finished, the report card stays on the page (even during a replay).
  useEffect(() => {
    if (clock.finished) setRevealed(true);
  }, [clock.finished]);

  // Rehearsal aid: `?t=31` opens the theatre paused at that moment of the show.
  const { seek } = clock;
  useEffect(() => {
    const at = Number(new URLSearchParams(window.location.search).get("t"));
    if (at > 0) seek(Math.min(at, T.end));
  }, [seek]);

  // Once the Orchestrator has read the schema, pan the camera down to the agents.
  useEffect(() => {
    if (clock.t < T.scrollAt) {
      scrolled.current = false;
    } else if (!scrolled.current) {
      scrolled.current = true;
      anchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      // If smooth scrolling stalls (e.g. the window lost focus), jump instead.
      setTimeout(() => {
        const top = anchorRef.current?.getBoundingClientRect().top ?? 0;
        if (Math.abs(top) > 60) anchorRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
      }, 1400);
    }
  }, [clock.t]);

  return (
    <>
      <DatasetSection
        rows={run.real}
        profile={run.profile}
        t={clock.t}
        running={clock.started && !clock.finished}
        finished={clock.finished}
        onGenerate={() => clock.start(0)}
      />
      {clock.started && (
        <AgentTheatre
          run={run}
          script={script}
          viz={viz}
          clock={clock}
          anchorRef={anchorRef}
          onReplay={() => clock.start(PHASES[0].start)}
          onDownload={() => downloadCsv(run.passes.final)}
        />
      )}
      {revealed && report && (
        <ReportSection
          report={report}
          run={run}
          onDownloadCsv={() => downloadCsv(run.passes.final)}
          onDownloadJson={() => downloadReport(run, report)}
        />
      )}
    </>
  );
}

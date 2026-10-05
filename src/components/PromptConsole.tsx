import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { AudioLines, ChevronRight, FileSpreadsheet, Plus } from "lucide-react";

const TABS = [
  {
    label: "Profile AI",
    prompt:
      "Profile scam_victim_reports_india.csv — map every distribution, correlation and PII field before anything is generated.",
  },
  {
    label: "Generate AI",
    prompt: "Generate 5,000 synthetic victim reports. Preserve the 65+ regional-language cohort and the heavy tail of amount lost.",
  },
  {
    label: "Critic AI",
    prompt: "Audit the synthetic twin. Any column with a KS distance above 0.10 goes back to its agent for repair.",
  },
  {
    label: "Report Card",
    prompt: "Grade the twin on fidelity, privacy, utility and fairness — and prove that zero real victims leaked.",
  },
];

const TYPE_MS = 26;
const HOLD_MS = 2600;

export default function PromptConsole() {
  const [active, setActive] = useState(0);
  const [typed, setTyped] = useState(0);
  const prompt = TABS[active].prompt;

  useEffect(() => {
    if (typed < prompt.length) {
      const t = setTimeout(() => setTyped((n) => n + 1), TYPE_MS + Math.random() * 28);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setActive((a) => (a + 1) % TABS.length);
      setTyped(0);
    }, HOLD_MS);
    return () => clearTimeout(t);
  }, [typed, prompt.length]);

  const selectTab = (i: number) => {
    setActive(i);
    setTyped(0);
  };

  const runDemo = () => document.getElementById("dataset")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="relative mx-auto w-full max-w-[680px]">
      {/* White halo that lifts the console off the grid */}
      <div aria-hidden="true" className="absolute -inset-x-16 -inset-y-12 rounded-[48px] bg-white/90 blur-2xl" />

      <div
        className="relative rounded-[14px] border border-[#d9d9df] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_24px_-12px_rgba(0,0,0,0.25),0_44px_70px_-34px_rgba(0,0,0,0.55)]"
        style={{ background: "linear-gradient(100deg, #f4f4f6 0%, #ebeaf0 50%, #d8d5e8 100%)" }}
      >
        <div role="tablist" className="flex gap-1 overflow-x-auto px-0.5 pb-1.5 pt-0.5 [scrollbar-width:none]">
          {TABS.map((tab, i) => (
            <button
              key={tab.label}
              role="tab"
              aria-selected={i === active}
              onClick={() => selectTab(i)}
              className={`relative shrink-0 rounded-md px-3 py-1.5 text-[14px] transition-colors ${
                i === active ? "text-white" : "text-[#2b2b2b] hover:text-black"
              }`}
            >
              {i === active && (
                <motion.span
                  layoutId="console-tab"
                  className="absolute inset-0 rounded-md bg-[#2b2b2b] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_2px_6px_rgba(0,0,0,0.3)]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-[10px] border border-[#1e1e1e] bg-panel shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <p className="h-[104px] px-4 pt-3.5 text-left text-[14px] leading-relaxed text-white/70 sm:h-[92px]">
            {prompt.slice(0, typed)}
            <span className="ml-px inline-block h-[1.05em] w-px translate-y-[3px] bg-white/80 [animation:caret-blink_1s_step-end_infinite]" />
          </p>

          <div className="flex items-center justify-between gap-3 border-t border-panel-line px-2.5 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <button
                aria-label="Attach dataset"
                className="grid size-7 shrink-0 place-items-center rounded-md border border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-white/10"
              >
                <Plus className="size-4" />
              </button>
              <span className="flex min-w-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[11.5px] text-white/60">
                <FileSpreadsheet className="size-3.5 shrink-0 text-signal" />
                <span className="truncate">scam_victim_reports_india.csv</span>
                <span className="hidden shrink-0 text-white/35 sm:inline">· 240 rows · 12 cols</span>
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                aria-label="Voice input"
                className="grid size-7 place-items-center rounded-md border border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-white/10"
              >
                <AudioLines className="size-4" />
              </button>
              <button
                aria-label="Run demo"
                onClick={runDemo}
                className="grid size-7 place-items-center rounded-md border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

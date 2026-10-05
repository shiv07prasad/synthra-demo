import { motion, type Variants } from "motion/react";
import { ChevronRight } from "lucide-react";
import GridBackground from "./GridBackground";
import PromptConsole from "./PromptConsole";
import RegulationStrip from "./RegulationStrip";

const rise: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: 0.08 + i * 0.09, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Hero() {
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <GridBackground />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pb-36 pt-24 text-center sm:pt-32">
          <motion.a
            href="#dataset"
            custom={0}
            variants={rise}
            initial="hidden"
            animate="show"
            className="group flex items-center gap-2.5 rounded-lg border border-[#d8d8d8] bg-[#ececec] py-1 pl-3.5 pr-1 font-mono text-[12px] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:text-[13.5px]"
          >
            <span className="relative flex size-2">
              <span className="absolute inset-0 rounded-full bg-signal [animation:signal-ping_2s_ease-out_infinite]" />
              <span className="relative size-2 rounded-full bg-signal" />
            </span>
            <span>
              Agentic Synthetic Data<span className="hidden sm:inline"> for Trust &amp; Safety</span>
            </span>
            <span className="grid size-7 place-items-center rounded-md border border-[#e2e2e2] bg-white shadow-sm transition-transform group-hover:translate-x-0.5">
              <ChevronRight className="size-4" strokeWidth={2.2} />
            </span>
          </motion.a>

          <motion.h1
            custom={1}
            variants={rise}
            initial="hidden"
            animate="show"
            className="mt-7 text-balance text-[40px] font-semibold leading-[1.06] tracking-[-0.04em] text-ink sm:text-[56px] lg:text-[66px]"
          >
            Stop Waiting Months for Data
            <br className="hidden sm:block" /> You&rsquo;re Not Allowed to Touch.
          </motion.h1>

          <motion.p
            custom={2}
            variants={rise}
            initial="hidden"
            animate="show"
            className="mt-5 max-w-[760px] text-pretty text-[16px] leading-relaxed text-ink-soft sm:text-[18.5px]"
          >
            AI agents profile sensitive data column by column, synthesize a privacy-safe twin, and grade it on
            fidelity, privacy and utility — without exposing a single real victim.
          </motion.p>

          <motion.div custom={3} variants={rise} initial="hidden" animate="show" className="mt-12 w-full">
            <PromptConsole />
          </motion.div>
        </div>
      </section>

      <RegulationStrip />
    </>
  );
}

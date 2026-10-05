import { CircleDashed, Fingerprint, Globe, Hexagon, Landmark, Lock, Scale, ShieldCheck } from "lucide-react";

// Rendered in deliberately mixed "logo" styles, like a customer-logo wall.
const REGULATIONS = [
  {
    key: "dpdp",
    node: (
      <span className="flex items-stretch border-2 border-current text-[13px] font-bold tracking-[0.08em]">
        <span className="bg-current px-1.5 py-0.5">
          <span className="text-white">DPDP</span>
        </span>
        <span className="px-1.5 py-0.5">ACT 2023</span>
      </span>
    ),
  },
  {
    key: "it-rules",
    node: (
      <span className="flex items-center gap-1.5 text-[17px] font-medium tracking-tight">
        <Scale className="size-5" strokeWidth={2.2} /> IT Rules 2021
      </span>
    ),
  },
  {
    key: "rbi",
    node: (
      <span className="flex items-center gap-2 text-[18px] font-semibold tracking-tight">
        <Landmark className="size-5" strokeWidth={2.2} /> RBI Directions
      </span>
    ),
  },
  {
    key: "cert-in",
    node: <span className="text-[22px] font-extrabold italic tracking-[-0.04em]">CERT-In</span>,
  },
  {
    key: "gdpr",
    node: (
      <span className="flex items-center gap-2 text-[17px] font-light tracking-[0.35em]">
        <Lock className="size-4" strokeWidth={2.4} /> GDPR
      </span>
    ),
  },
  {
    key: "eu-ai-act",
    node: (
      <span className="flex flex-col items-center leading-none">
        <span className="flex gap-1">
          <Hexagon className="size-4 fill-current" />
          <Globe className="size-4" strokeWidth={2.6} />
          <CircleDashed className="size-4" strokeWidth={2.6} />
        </span>
        <span className="mt-1 text-[14px] font-medium">EU AI Act</span>
      </span>
    ),
  },
  {
    key: "nist",
    node: (
      <span className="flex items-center gap-1.5 text-[19px] font-bold tracking-tight">
        <ShieldCheck className="size-6 fill-current stroke-white" strokeWidth={1.6} /> NIST AI RMF
      </span>
    ),
  },
  {
    key: "iso",
    node: (
      <span className="flex items-center gap-2 text-[17px] font-medium">
        <Fingerprint className="size-5" strokeWidth={2} /> ISO/IEC 42001
      </span>
    ),
  },
];

export default function RegulationStrip() {
  return (
    <section className="relative bg-white pb-24 pt-4">
      <p className="text-center font-mono text-[15px] text-ink">Designed For Data Governed By</p>
      <div className="mx-auto mt-12 grid max-w-6xl grid-cols-2 gap-x-6 gap-y-12 px-6 text-[#9a9a9a] md:grid-cols-4 md:gap-y-16">
        {REGULATIONS.map((r) => (
          <div key={r.key} className="flex items-center justify-center transition-colors hover:text-ink-soft">
            {r.node}
          </div>
        ))}
      </div>
    </section>
  );
}

import { ArrowRight } from "lucide-react";
import Logo from "./Logo";
import { GlowLayers, Shimmer } from "./Glow";

export default function Navbar() {
  return (
    <header className="relative z-40 border-b border-line bg-white">
      <nav className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-4 sm:px-8 lg:px-16">
        <Logo />

        <a href="#dataset" className="group relative isolate inline-flex rounded-[9px] p-[1.5px]">
          <GlowLayers />
          <span className="relative flex items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-[7.5px] bg-[#2b2b2b] px-4 py-2.5 font-mono text-[15px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition-colors group-hover:bg-[#1c1c1c]">
            Run Demo
            <ArrowRight className="size-4 [animation:nudge_2.4s_ease-in-out_infinite]" strokeWidth={2} />
            <Shimmer />
          </span>
        </a>
      </nav>
    </header>
  );
}

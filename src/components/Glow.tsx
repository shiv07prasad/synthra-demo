// Attention effects for primary CTAs. The parent must be:
//   `group relative isolate inline-flex p-[1.5px] rounded-[…]`
// with the visible button face as a `relative overflow-hidden` child.

export function GlowLayers({ active = true }: { active?: boolean }) {
  if (!active) return null;
  return (
    <>
      {/* Soft pulsing halo */}
      <span
        aria-hidden="true"
        className="absolute -inset-1.5 -z-10 rounded-xl opacity-60 blur-md transition-opacity [animation:halo-pulse_2.8s_ease-in-out_infinite] group-hover:opacity-100"
        style={{ background: "conic-gradient(from 180deg, #818cf8, #22c55e, #38bdf8, #818cf8)" }}
      />
      {/* Light beam travelling around the border */}
      <span aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[inherit] bg-[#3a3a3a]">
        <span
          className="absolute left-1/2 top-1/2 aspect-square w-[220%] [animation:beam-spin_3s_linear_infinite]"
          style={{ background: "conic-gradient(from 0deg, transparent 0 55%, #a5b4fc 72%, #4ade80 88%, transparent 100%)" }}
        />
      </span>
    </>
  );
}

export function Shimmer({ active = true }: { active?: boolean }) {
  if (!active) return null;
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent [animation:shimmer_3.4s_ease-in-out_infinite]"
    />
  );
}

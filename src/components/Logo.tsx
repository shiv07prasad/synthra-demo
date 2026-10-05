// Two overlapping discs: the real record and its synthetic twin.
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="#" className={`flex items-center gap-2.5 ${className}`} aria-label="Synthra home">
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
        <circle cx="17" cy="17" r="15" fill="#151515" />
        <circle cx="20.5" cy="13.5" r="6.5" fill="#fff" />
        <circle cx="20.5" cy="13.5" r="2.6" fill="#151515" />
      </svg>
      <span className="text-[19px] font-semibold tracking-[-0.03em] text-ink">Synthra</span>
    </a>
  );
}

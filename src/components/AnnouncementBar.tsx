export default function AnnouncementBar() {
  return (
    <div className="bg-[#1a1a1a] text-white">
      <div className="mx-auto flex h-10 max-w-7xl items-center justify-center gap-5 px-4 text-[13px] sm:text-sm">
        <a href="#dataset" className="truncate underline underline-offset-[3px] decoration-white/60 hover:decoration-white">
          <span className="hidden sm:inline">TopGear Ideathon · </span>Scaled Data Generation &amp; Evaluation
        </a>
        <a href="#dataset" className="shrink-0 underline underline-offset-[3px] decoration-white/60 hover:decoration-white">
          Run the Demo →
        </a>
      </div>
    </div>
  );
}

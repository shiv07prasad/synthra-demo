import { useMemo, type CSSProperties } from "react";

const CELL = 50;
const COLS = 44;
const ROWS = 17;

// Deterministic PRNG so the pattern is identical on every render and reload.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Cell = { col: number; row: number; pulse: boolean; delay: number; duration: number; shade: string };

function buildCells(): Cell[] {
  const rand = mulberry32(11);
  const taken = new Set<string>();
  const cells: Cell[] = [];
  const center = COLS / 2;

  while (cells.length < 78) {
    const col = Math.floor(rand() * COLS);
    const row = Math.floor(rand() * ROWS);
    const key = `${col}:${row}`;
    if (taken.has(key)) continue;

    // Keep the middle (where the copy sits) mostly clear.
    const distFromCenter = Math.abs(col + 0.5 - center) / center;
    if (distFromCenter < 0.32 && rand() < 0.85) continue;

    taken.add(key);
    cells.push({
      col,
      row,
      pulse: rand() < 0.35,
      delay: rand() * 8,
      duration: 5 + rand() * 5,
      shade: rand() < 0.5 ? "#efefef" : "#f4f4f4",
    });
  }
  return cells;
}

const maskStyle: CSSProperties = {
  maskImage:
    "radial-gradient(ellipse 34% 46% at 50% 40%, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.12) 40%, #000 100%), linear-gradient(to bottom, #000 0%, #000 72%, transparent 100%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 34% 46% at 50% 40%, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.12) 40%, #000 100%), linear-gradient(to bottom, #000 0%, #000 72%, transparent 100%)",
  maskComposite: "intersect",
  WebkitMaskComposite: "source-in",
};

export default function GridBackground() {
  const cells = useMemo(buildCells, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={maskStyle}>
      <div
        className="absolute top-0"
        style={{
          left: `calc(50% - ${(COLS * CELL) / 2}px)`,
          width: COLS * CELL,
          height: ROWS * CELL,
        }}
      >
        {cells.map((c) => (
          <div
            key={`${c.col}:${c.row}`}
            className="absolute"
            style={{
              left: c.col * CELL,
              top: c.row * CELL,
              width: CELL,
              height: CELL,
              background: c.shade,
              animation: c.pulse ? `cell-pulse ${c.duration}s ease-in-out ${c.delay}s infinite` : undefined,
              opacity: c.pulse ? 0 : 1,
            }}
          />
        ))}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ebebeb 1px, transparent 1px), linear-gradient(to bottom, #ebebeb 1px, transparent 1px)",
            backgroundSize: `${CELL}px ${CELL}px`,
          }}
        />
      </div>
    </div>
  );
}

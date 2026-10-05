// Tiny SVG chart primitives sized for agent cards.

export function Bars({
  values,
  reveal = 1,
  compare,
  height = 34,
  fill = "#d4d4d8",
  compareColor = "#6366f1",
}: {
  values: number[];
  reveal?: number;
  compare?: number[];
  height?: number;
  fill?: string;
  compareColor?: string;
}) {
  const n = values.length;
  const max = Math.max(...values, ...(compare ?? [])) || 1;
  const w = 100 / n;
  const shown = reveal * n;

  const step = compare
    ? compare
        .map((v, i) => {
          const y = height - (v / max) * (height - 2);
          return `${i === 0 ? `M0 ${height} V${y}` : `V${y}`} H${(i + 1) * w}`;
        })
        .join(" ") + ` V${height}`
    : null;

  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="block w-full" style={{ height }}>
      {values.map((v, i) => {
        const grow = Math.min(1, Math.max(0, shown - i));
        const h = (v / max) * (height - 2) * grow;
        return <rect key={i} x={i * w + w * 0.12} y={height - h} width={w * 0.76} height={h} rx={0.6} fill={fill} />;
      })}
      {step && <path d={step} fill="none" stroke={compareColor} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}

export function Meter({ value, color = "#2b2b2b", track = "#efefef" }: { value: number; color?: string; track?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: track }}>
      <div className="h-full rounded-full transition-[width] duration-150" style={{ width: `${Math.min(100, value * 100)}%`, background: color }} />
    </div>
  );
}

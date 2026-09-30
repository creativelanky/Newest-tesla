'use client';

// Compact inline sparkline from a numeric series. Colour follows direction.
export default function Sparkline({ data = [], width = 96, height = 28, up = true, strokeWidth = 1.4 }) {
  if (!data || data.length < 2) return <svg width={width} height={height} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => [i * step, height - ((v - min) / range) * (height - 2) - 1]);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const color = up ? '#34d399' : '#f87171';

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

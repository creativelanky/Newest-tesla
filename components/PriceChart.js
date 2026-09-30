'use client';

// Filled area price chart with a gridline and a live end-marker. Pure SVG so it
// scales crisply and needs no chart library.
export default function PriceChart({ data = [], height = 220, up = true }) {
  if (!data || data.length < 2) {
    return <div className="w-full" style={{ height }} />;
  }
  const W = 1000;
  const H = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = range * 0.12;
  const lo = min - pad;
  const hi = max + pad;
  const r = hi - lo || 1;
  const step = W / (data.length - 1);
  const y = (v) => H - ((v - lo) / r) * H;
  const pts = data.map((v, i) => [i * step, y(v)]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;
  const color = up ? '#34d399' : '#f87171';
  const last = pts[pts.length - 1];
  const gid = up ? 'g-up' : 'g-dn';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" y1={H * f} x2={W} y2={H * f} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {/* Pulsing live marker at the leading edge */}
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="none" stroke={color} strokeWidth="2">
        <animate attributeName="r" from="3.5" to="11" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.9" to="0" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={color} />
    </svg>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';

// Renders a number that briefly flashes green (up) or red (down) whenever it
// changes — the core "alive" cue for live prices.
export default function LiveNumber({ value, render, className = '' }) {
  const prev = useRef(value);
  const [flash, setFlash] = useState('');

  useEffect(() => {
    if (value > prev.current) setFlash('flash-up');
    else if (value < prev.current) setFlash('flash-down');
    prev.current = value;
    const t = setTimeout(() => setFlash(''), 700);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <span className={`inline-block px-1 tabular-nums ${flash} ${className}`}>
      {render ? render(value) : value}
    </span>
  );
}

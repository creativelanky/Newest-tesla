'use client';

import { useEffect, useRef, useState } from 'react';

// Fades children up on first scroll into view.
export default function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity .7s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .7s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

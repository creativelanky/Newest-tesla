'use client';

import { useEffect } from 'react';
import Logo from './Logo';
import { IconClose } from './DeskIcons';

// Full-screen takeover used by the money flows (deposit / withdraw). A bold
// coloured context panel on the left carries the purpose + summary; the form
// lives on the right with room to breathe. Replaces the old bottom-sheet modal.
const TONES = {
  scarlet: {
    panel: 'linear-gradient(160deg, #4a1518 0%, #340f14 46%, #0d0b12 100%)',
    glow: 'radial-gradient(620px 340px at 100% 0%, rgba(255,90,95,0.22), transparent 60%)',
    border: 'rgba(229,72,77,0.30)',
    accent: '#ff9d9a',
  },
  azure: {
    panel: 'linear-gradient(160deg, #17224a 0%, #121734 46%, #0b0d16 100%)',
    glow: 'radial-gradient(620px 340px at 100% 0%, rgba(79,139,255,0.22), transparent 60%)',
    border: 'rgba(79,139,255,0.28)',
    accent: '#a7c2ff',
  },
};

export default function FlowScreen({ open, onClose, tone = 'azure', eyebrow, title, lede, aside, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  const t = TONES[tone] || TONES.azure;

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-ink">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-ink/85 px-5 py-4 backdrop-blur sm:px-8">
        <Logo height="h-6" />
        <button
          onClick={onClose}
          aria-label="Close"
          className="grid h-9 w-9 place-items-center rounded-lg border border-line text-grey-300 transition-colors hover:border-white/40 hover:text-white"
        >
          <IconClose className="h-4 w-4" />
        </button>
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-65px)] w-full max-w-5xl lg:grid-cols-[0.82fr_1.18fr]">
        {/* Left — coloured context panel */}
        <aside
          className="relative hidden overflow-hidden p-9 lg:flex lg:flex-col"
          style={{ background: `${t.glow}, ${t.panel}`, borderRight: `1px solid ${t.border}` }}
        >
          <div className="relative">
            {eyebrow && (
              <p className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: t.accent }}>{eyebrow}</p>
            )}
            <h2 className="mt-3 font-sans text-[30px] font-bold leading-[1.1] tracking-tight text-white">{title}</h2>
            {lede && <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-grey-300">{lede}</p>}
          </div>
          {aside && <div className="relative mt-auto pt-10">{aside}</div>}
        </aside>

        {/* Right — the form */}
        <section className="px-5 py-9 sm:px-12 sm:py-12">
          {/* Compact heading on mobile, where the side panel is hidden */}
          <div className="mb-7 lg:hidden">
            {eyebrow && (
              <p className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: t.accent }}>{eyebrow}</p>
            )}
            <h2 className="mt-2 font-sans text-[24px] font-bold tracking-tight text-white">{title}</h2>
          </div>
          <div className="mx-auto max-w-md">{children}</div>
        </section>
      </div>
    </div>
  );
}

// Vertical step tracker for the left panel.
export function FlowSteps({ steps, current, tone = 'azure' }) {
  const accent = (TONES[tone] || TONES.azure).accent;
  return (
    <ol className="space-y-4">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <li key={label} className="flex items-center gap-3">
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold transition-colors"
              style={
                done || active
                  ? { background: accent, color: '#0b0b0d' }
                  : { border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.5)' }
              }
            >
              {done ? '✓' : n}
            </span>
            <span className={`text-[14px] ${active ? 'font-semibold text-white' : done ? 'text-grey-300' : 'text-grey-500'}`}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

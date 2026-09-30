'use client';

import AuthGate from '@/components/AuthGate';
import { useStore } from '@/lib/store';

// Standard authed page shell with an eyebrow + heading.
export default function DeskPage({ eyebrow, title, intro, children }) {
  return (
    <AuthGate>
      <Inner eyebrow={eyebrow} title={title} intro={intro}>
        {children}
      </Inner>
    </AuthGate>
  );
}

function Inner({ eyebrow, title, intro, children }) {
  const { state, ready } = useStore();
  if (!ready || !state.user) return null;
  return (
    <div className="app-shell container-page pb-24 pt-28">
      <p className="eyebrow flex items-center gap-2.5"><span className="live-dot" /> {eyebrow}</p>
      <h1 className="h1 mt-3 text-[clamp(1.9rem,4.4vw,3.2rem)] uppercase text-white">{title}</h1>
      {intro && <p className="body-lg mt-4 max-w-2xl">{intro}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}

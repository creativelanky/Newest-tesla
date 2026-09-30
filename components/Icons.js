// Minimal inline icon set (stroke-based, currentColor).
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function IconRocket({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4.5 16.5c-1.5 1-2 5-2 5s4-.5 5-2c.6-.9.5-2.2-.3-3-.8-.8-2.1-.9-2.7-.1Z" />
      <path d="M15 9a6 6 0 0 0-6 6l-3-1 1-3a10 10 0 0 1 9-6l3-.5-.5 3a10 10 0 0 1-6 9l-1-3a6 6 0 0 0 3.5-4.5Z" />
      <circle cx="14.5" cy="9.5" r="1.4" />
    </svg>
  );
}

export function IconWallet({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a1 1 0 0 1 1 1v1.5" />
      <rect x="3" y="7.5" width="18" height="12" rx="2.5" />
      <path d="M16 12.5h3v3h-3a1.5 1.5 0 0 1 0-3Z" />
    </svg>
  );
}

export function IconChart({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 15l3-4 3 2 4-6" />
    </svg>
  );
}

export function IconArrowDown({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 5v14" />
      <path d="M6 13l6 6 6-6" />
    </svg>
  );
}

export function IconArrowUp({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </svg>
  );
}

export function IconShield({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function IconGlobe({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.5 3.5 5.7 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.7-3.5-9s1-6.5 3.5-9Z" />
    </svg>
  );
}

export function IconBolt({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M13 3L5 13h6l-1 8 8-10h-6l1-8Z" />
    </svg>
  );
}

export function IconCheck({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M5 12l5 5 9-11" />
    </svg>
  );
}

export function IconMenu({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

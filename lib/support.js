'use client';

// Opens the Chaport live chat widget. Chaport queues calls until its SDK has
// loaded, so this is safe to call immediately on click.
export function openSupport() {
  if (typeof window === 'undefined') return;
  const c = window.chaport;
  if (c && typeof c.q === 'function') {
    c.q('open');
  }
}

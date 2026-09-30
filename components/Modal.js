'use client';

import { useEffect } from 'react';
import { IconClose } from './DeskIcons';

// Centred sheet used for funding flows and admin editors.
export default function Modal({ open, onClose, title, subtitle, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-card p-6 shadow-2xl sm:rounded-2xl ${
          wide ? 'max-w-2xl' : 'max-w-md'
        }`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-semibold text-white">{title}</h2>
            {subtitle && <p className="mt-1 text-[14px] text-grey-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-grey-400 hover:text-white" aria-label="Close">
            <IconClose className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

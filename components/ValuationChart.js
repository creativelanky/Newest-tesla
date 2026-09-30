'use client';

import { VALUATION_MARKS } from '@/lib/content';

// Minimal bar plot — hairlines and type only, no chrome.
export default function ValuationChart() {
  const max = Math.max(...VALUATION_MARKS.map(([, v]) => v));

  return (
    <div className="mt-9">
      <div className="flex h-48 items-end gap-2 border-b border-line sm:gap-3">
        {VALUATION_MARKS.map(([year, value], i) => {
          const last = i === VALUATION_MARKS.length - 1;
          return (
            <div key={year} className="flex flex-1 flex-col items-center justify-end gap-2">
              <span className={`mono text-[11px] ${last ? 'text-white' : 'text-grey-500'}`}>
                {value}
              </span>
              <div
                className={`w-full ${last ? 'bg-white' : 'bg-white/30'}`}
                style={{ height: `${(value / max) * 100}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 pt-3 sm:gap-3">
        {VALUATION_MARKS.map(([year]) => (
          <span key={year} className="mono flex-1 text-center text-[10px] text-grey-500">
            {year}
          </span>
        ))}
      </div>
      <p className="eyebrow mt-4">Reported valuation — USD billions</p>
    </div>
  );
}

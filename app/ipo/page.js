'use client';

import DeskPage from '@/components/DeskPage';
import { IpoPanel } from '@/components/DeskExtras';

const FACTS = [
  ['Structure', 'Primary + secondary'],
  ['Indicative band', '$380 – $420'],
  ['Lock-up', '180 days'],
  ['Min. allocation', '$1,000'],
];

export default function IpoPage() {
  return (
    <DeskPage
      eyebrow="Primary market"
      title="SpaceX IPO"
      intro="Reserve a priority allocation ahead of the indicative listing. Confirm your final size at pricing — cancel any time before."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <IpoPanel />
        <div className="tile p-6 sm:p-8">
          <h3 className="tile-title">Offering terms</h3>
          <dl className="mt-5 grid grid-cols-2 gap-x-8 border-t border-line">
            {FACTS.map(([k, v]) => (
              <div key={k} className="border-b border-line py-4">
                <dt className="text-[11px] uppercase tracking-wider text-grey-500">{k}</dt>
                <dd className="num mt-1.5 text-[15px] text-white">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="body mt-6 text-[13px]">
            Reservations are non-binding indications of interest. Your final allocation is confirmed at
            pricing, and you may release your reservation at any time before then.
          </p>
        </div>
      </div>
    </DeskPage>
  );
}

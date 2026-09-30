'use client';

import Link from 'next/link';
import DeskPage from '@/components/DeskPage';
import { useStore, formatUSD, holdingValue, investedTotal, portfolioValue } from '@/lib/store';
import { getOpportunity } from '@/lib/opportunities';
import { IconLayers } from '@/components/DeskIcons';

export default function HoldingsPage() {
  return (
    <DeskPage
      eyebrow="Program portfolio"
      title="Holdings"
      intro="Your fractional positions across SpaceX programs, marked to model value."
    >
      <Holdings />
    </DeskPage>
  );
}

function Holdings() {
  const { state } = useStore();
  const holdings = Object.entries(state.holdings || {});
  const invested = investedTotal(state);
  const value = portfolioValue(state);
  const gain = value - invested;
  const gainPct = invested > 0 ? (gain / invested) * 100 : 0;

  return (
    <>
      <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
        <Kpi label="Portfolio value" value={formatUSD(value, { cents: true })} />
        <Kpi label="Total invested" value={formatUSD(invested, { cents: true })} />
        <Kpi
          label="Unrealised P&L"
          value={`${gain >= 0 ? '+' : ''}${formatUSD(gain, { cents: true })} (${gain >= 0 ? '+' : ''}${gainPct.toFixed(2)}%)`}
          tone={gain >= 0 ? 'gain' : 'loss'}
        />
      </div>

      <div className="mt-6 tile overflow-hidden">
        <div className="tile-head">
          <h3 className="tile-title flex items-center gap-2.5"><span className="icon-chip"><IconLayers className="h-3.5 w-3.5" /></span>Positions</h3>
          <Link href="/invest" className="btn-outline btn-sm">Browse programs</Link>
        </div>
        {holdings.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-[14px] text-grey-400">You don't hold any programs yet.</p>
            <Link href="/invest" className="btn-solid mt-5 btn-sm">Invest in a program</Link>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {holdings.map(([id, h]) => {
              const opp = getOpportunity(id);
              if (!opp) return null;
              const v = holdingValue(opp, h);
              const g = v - h.invested;
              const gp = h.invested > 0 ? (g / h.invested) * 100 : 0;
              return (
                <div key={id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium text-white">{opp.name}</div>
                    <div className="mt-1 text-[11px] text-grey-500">
                      {opp.ticker} · {h.units.toFixed(3)} units · invested {formatUSD(h.invested, { cents: true })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="num text-[14px] text-white">{formatUSD(v, { cents: true })}</div>
                    <div className={`num text-[11px] ${g >= 0 ? 'text-gain' : 'text-loss'}`}>
                      {g >= 0 ? '+' : ''}{gp.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function Kpi({ label, value, tone }) {
  return (
    <div className="tile-solid rounded-none border-0 p-5">
      <div className="text-[10px] uppercase tracking-wider text-grey-500">{label}</div>
      <div className={`mt-2.5 font-sans text-[20px] font-bold tracking-tight ${tone === 'gain' ? 'text-gain' : tone === 'loss' ? 'text-loss' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}

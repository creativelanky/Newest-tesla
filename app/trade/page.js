'use client';

import DeskPage from '@/components/DeskPage';
import DeskChart from '@/components/DeskChart';
import { TradePanel, PositionsTable } from '@/components/DeskTrade';
import { OptionsPanel, OptionsPositions } from '@/components/DeskOptions';

export default function TradePage() {
  return (
    <DeskPage
      eyebrow="Derivatives desk"
      title="Trade SPX"
      intro="Go long or short with leverage, or run the SpaceX options chain. Every position is marked to the live price."
    >
      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <DeskChart />
        <TradePanel />
      </div>

      <div className="mt-6">
        <PositionsTable />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <OptionsPanel />
        <OptionsPositions />
      </div>
    </DeskPage>
  );
}

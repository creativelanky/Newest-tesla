'use client';

import DeskPage from '@/components/DeskPage';
import { CopyTradingPanel } from '@/components/DeskExtras';

export default function CopyPage() {
  return (
    <DeskPage
      eyebrow="Social trading"
      title="Copy trading"
      intro="Allocate capital to a lead SpaceX desk and mirror their book automatically. Allocations move with their live performance."
    >
      <CopyTradingPanel />
    </DeskPage>
  );
}

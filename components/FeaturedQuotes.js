'use client';

import QuoteCard from './QuoteCard';
import { useMarket } from '@/lib/market';

const SYMS = ['SPX', 'STRSHP', 'STRLNK', 'MARS'];

// A compact 2×2 grid of featured live quotes for the landing page.
export default function FeaturedQuotes() {
  const { quotes, ready } = useMarket();
  return (
    <div className="grid grid-cols-2 gap-4">
      {SYMS.map((s) => (
        <QuoteCard key={s} quote={ready ? quotes[s] : null} />
      ))}
    </div>
  );
}

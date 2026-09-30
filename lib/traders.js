// Fictional lead traders for the SpaceX copy-trading desk. `alpha` is a baked-in
// edge; `beta` is sensitivity to the live SPX move — both feed the simulated
// value of a copied allocation. Entirely made up.
export const TRADERS = [
  {
    id: 'orbital-ace',
    handle: 'OrbitalAce',
    name: 'M. Vega',
    strategy: 'Momentum · Launch cadence',
    ret: 214.6,
    win: 78,
    followers: 18420,
    risk: 'High',
    alpha: 0.09,
    beta: 1.8,
  },
  {
    id: 'delta-v',
    handle: 'Delta-V',
    name: 'R. Okafor',
    strategy: 'Swing · Starship catalysts',
    ret: 168.2,
    win: 71,
    followers: 12960,
    risk: 'High',
    alpha: 0.06,
    beta: 1.5,
  },
  {
    id: 'apogee',
    handle: 'ApogeeCapital',
    name: 'L. Nordin',
    strategy: 'Core · Starlink cash-flow',
    ret: 96.4,
    win: 82,
    followers: 24310,
    risk: 'Medium',
    alpha: 0.05,
    beta: 0.9,
  },
  {
    id: 'perigee',
    handle: 'PerigeeQuant',
    name: 'S. Haddad',
    strategy: 'Market-neutral · Options',
    ret: 61.9,
    win: 88,
    followers: 15870,
    risk: 'Low',
    alpha: 0.04,
    beta: 0.35,
  },
];

export function getTrader(id) {
  return TRADERS.find((t) => t.id === id) || null;
}

// Live value of a copied allocation given the SPX day move (percent from open).
export function copyValue(allocated, trader, spxDayPct) {
  if (!trader) return allocated;
  const move = (trader.beta * spxDayPct) / 100 + trader.alpha * 0.12;
  return Math.max(0, allocated * (1 + move));
}

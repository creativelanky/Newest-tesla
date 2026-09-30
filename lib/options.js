// A lightweight option-pricing toy for the SPX contract. Not Black–Scholes — just
// intrinsic value plus a time-value term that scales with distance to expiry and
// a fixed implied-vol assumption, so premiums move sensibly as spot moves.

export const EXPIRIES = [
  { id: '30d', label: '30D', days: 30 },
  { id: '90d', label: '90D', days: 90 },
  { id: '180d', label: '180D', days: 180 },
];

const IV = 0.55; // assumed implied volatility

export function optionPremium({ kind, strike, spot, days }) {
  const t = Math.max(days, 1) / 365;
  const intrinsic = kind === 'call' ? Math.max(0, spot - strike) : Math.max(0, strike - spot);
  // Time value peaks at-the-money and decays with |moneyness|.
  const moneyness = Math.abs(spot - strike) / spot;
  const atmValue = spot * IV * Math.sqrt(t);
  const timeValue = atmValue * Math.exp(-moneyness * 3.2);
  return Math.max(0.05, intrinsic + timeValue);
}

// Build a strike ladder centred on spot, rounded to a clean increment.
export function buildChain(spot, days) {
  const step = spot > 300 ? 20 : spot > 150 ? 10 : 5;
  const atm = Math.round(spot / step) * step;
  const strikes = [];
  for (let i = -4; i <= 4; i++) strikes.push(atm + i * step);
  return strikes.map((strike) => ({
    strike,
    call: optionPremium({ kind: 'call', strike, spot, days }),
    put: optionPremium({ kind: 'put', strike, spot, days }),
    atm: strike === atm,
  }));
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import { openSupport } from '@/lib/support';
import { useStore, logOut, formatUSD } from '@/lib/store';
import {
  IconGauge,
  IconCandles,
  IconUsers,
  IconSpark,
  IconLayers,
  IconWalletLine,
  IconPackage,
  IconArrowUpRight,
  IconChat,
} from './DeskIcons';

const MARKETING_LINKS = [
  { href: '/#vehicles', label: 'Vehicles' },
  { href: '/#starlink', label: 'Starlink' },
  { href: '/#vision', label: 'The Mission' },
  { href: '/#opportunities', label: 'Invest' },
  { href: '/#faq', label: 'FAQ' },
];

const APP_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: IconGauge },
  { href: '/trade', label: 'Trade', icon: IconCandles },
  { href: '/copy', label: 'Copy', icon: IconUsers },
  { href: '/ipo', label: 'IPO', icon: IconSpark },
  { href: '/holdings', label: 'Holdings', icon: IconLayers },
  { href: '/wallet', label: 'Wallet', icon: IconWalletLine },
  { href: '/tracking', label: 'Tracking', icon: IconPackage },
  { key: 'support', label: 'Support', icon: IconChat, action: 'support' },
];

export default function SiteNav() {
  const { state, ready } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const authed = ready && state.user;
  const links = authed ? APP_LINKS : MARKETING_LINKS;
  // The admin console is a standalone surface with its own chrome.
  const isAdmin = pathname?.startsWith('/admin');
  // Only the landing page has a full-bleed hero for the bar to float over.
  const transparent = pathname === '/' && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (isAdmin) return null;

  async function handleLogout() {
    await logOut();
    setOpen(false);
    router.push('/');
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        pathname === '/' ? 'brand-type ' : ''
      }${transparent ? 'bg-transparent' : 'border-b border-line bg-black/95 backdrop-blur'}`}
    >
      <div className="container-page flex h-[72px] items-center justify-between gap-6">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => {
            const active = authed && pathname === l.href;
            const cls = `rounded-md px-3 py-1.5 text-[12px] font-medium tracking-wider2 transition-colors ${
              active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
            }`;
            if (l.action === 'support') {
              return (
                <button key="support" onClick={openSupport} className={cls}>
                  {l.label}
                </button>
              );
            }
            return (
              <Link key={l.href} href={l.href} aria-current={active ? 'page' : undefined} className={cls}>
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-6 lg:flex">
          {authed ? (
            <>
              <NotificationBell />
              <span className="mono text-[13px] text-grey-300">{formatUSD(state.balance)}</span>
              <span className="h-4 w-px bg-white/20" />
              <span className="text-[12px] tracking-wider2 text-grey-400">
                {state.user.name?.split(' ')[0]}
              </span>
              <button
                onClick={handleLogout}
                className="text-[12px] font-medium tracking-wider2 text-white/75 transition-colors hover:text-white"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[12px] font-medium tracking-wider2 text-white/75 transition-colors hover:text-white"
              >
                Log in
              </Link>
              <Link href="/signup" className="btn-solid btn-sm">
                Open account
              </Link>
            </>
          )}
        </div>

        <button
          className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span
            className={`block h-px w-6 bg-white transition-transform duration-300 ${
              open ? 'translate-y-[6px] rotate-45' : ''
            }`}
          />
          <span className={`block h-px w-6 bg-white transition-opacity ${open ? 'opacity-0' : ''}`} />
          <span
            className={`block h-px w-6 bg-white transition-transform duration-300 ${
              open ? '-translate-y-[6px] -rotate-45' : ''
            }`}
          />
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-black/95 backdrop-blur-xl lg:hidden">
          <nav className="container-page flex flex-col py-5">
            {/* Balance summary sits at the top of the sheet when signed in */}
            {authed && (
              <div className="mb-4 rounded-xl border border-line bg-white/[0.03] px-4 py-3.5">
                <div className="stat-label">Total available</div>
                <div className="figure-md mt-1.5">{formatUSD(state.balance, { cents: true })}</div>
              </div>
            )}

            <div className="grid gap-1">
              {links.map((l) => {
                const active = authed && pathname === l.href;
                const Icon = l.icon;
                const chip = Icon ? (
                  <span className={`icon-chip ${active ? 'border-white/25 text-white' : ''}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <span className="h-1 w-1 rounded-full bg-grey-600" />
                );
                const cls = `flex items-center gap-3 rounded-lg px-3 py-3 text-[13px] font-medium tracking-wide transition-colors ${
                  active ? 'bg-white/10 text-white' : 'text-grey-300 hover:bg-white/[0.05] hover:text-white'
                }`;
                if (l.action === 'support') {
                  return (
                    <button key="support" onClick={() => { setOpen(false); openSupport(); }} className={`${cls} text-left`}>
                      {chip}
                      {l.label}
                    </button>
                  );
                }
                return (
                  <Link key={l.href} href={l.href} aria-current={active ? 'page' : undefined} className={cls}>
                    {chip}
                    {l.label}
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />}
                  </Link>
                );
              })}
            </div>

            {authed ? (
              <button
                onClick={handleLogout}
                className="mt-4 flex items-center gap-3 rounded-lg border border-line px-3 py-3 text-[13px] font-medium text-grey-300 transition-colors hover:text-white"
              >
                <span className="icon-chip"><IconArrowUpRight className="h-3.5 w-3.5" /></span>
                Log out
              </button>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                <Link href="/login" className="btn-outline w-full">
                  Log in
                </Link>
                <Link href="/signup" className="btn-solid w-full">
                  Open account
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';

const COLS = [
  [
    'Programs',
    [
      ['Falcon 9', '/#falcon-9'],
      ['Falcon Heavy', '/#falcon-heavy'],
      ['Dragon', '/#dragon'],
      ['Starship', '/#starship'],
      ['Starlink', '/#starlink'],
    ],
  ],
  [
    'Platform',
    [
      ['Opportunities', '/#opportunities'],
      ['Dashboard', '/dashboard'],
      ['Wallet', '/wallet'],
      ['Open account', '/signup'],
      ['Log in', '/login'],
    ],
  ],
  [
    'About',
    [
      ['The mission', '/#vision'],
      ['Track record', '/#vision'],
      ['FAQ', '/#faq'],
    ],
  ],
];

export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <footer className={`border-t border-line bg-black ${pathname === '/' ? 'brand-type' : ''}`}>
      <div className="container-page py-16">
        <div className="grid gap-12 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <Logo height="h-8" />
            <p className="body mt-5 max-w-xs text-[14px]">
              A design prototype exploring what fractional access to spaceflight programs could look
              like.
            </p>
          </div>

          {COLS.map(([title, links]) => (
            <div key={title}>
              <h4 className="eyebrow mb-5">{title}</h4>
              <ul className="space-y-3">
                {links.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-[13px] tracking-wide text-grey-400 transition-colors hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-line pt-8">
          <p className="text-[11px] text-grey-600">
            © {new Date().getFullYear()} SpaceX Invest. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

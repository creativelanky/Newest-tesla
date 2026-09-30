import './globals.css';
import Script from 'next/script';
import { Inter, Barlow } from 'next/font/google';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';

// Inter is the platform UI font — clean and highly legible across the app,
// auth and admin. The landing page keeps Barlow (the DIN-style brand look),
// scoped via the `.brand-type` class.
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-brand',
  display: 'swap',
});

const SITE_DESC =
  'Fractional access to SpaceX programs — Falcon 9, Falcon Heavy, Dragon, Starship, Raptor and Starlink. Deposit, invest and withdraw from one account.';
const SITE_TITLE = 'SpaceX Invest — Back the company making life multiplanetary';

export const metadata = {
  metadataBase: new URL('https://www.spacexteslaexpand.xyz'),
  title: {
    default: SITE_TITLE,
    template: '%s · SpaceX Invest',
  },
  description: SITE_DESC,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESC,
    url: '/',
    siteName: 'SpaceX Invest',
    type: 'website',
    images: [{ url: '/og-falcon9.jpg', width: 1200, height: 630, type: 'image/jpeg', alt: 'Falcon 9 launch streak over the coast' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESC,
    images: ['/og-falcon9.jpg'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${barlow.variable}`}>
      <body className="flex min-h-screen flex-col bg-ink">
        <SiteNav />
        <main className="flex-1">{children}</main>
        <SiteFooter />

        {/* Chaport live chat — config + queue shim first, then the SDK is
            loaded by next/script itself (more reliable than the vendor snippet's
            manual insertBefore under production hydration). */}
        <Script id="chaport-config" strategy="beforeInteractive">
          {`window.chaportConfig={appId:'6a9fd7d74eabbf1177b1f38f'};if(!window.chaport){var v3=window.chaport={};v3._q=[];v3._l={};v3.q=function(){v3._q.push(arguments)};v3.on=function(e,fn){if(!v3._l[e])v3._l[e]=[];v3._l[e].push(fn)};}`}
        </Script>
        <Script id="chaport-sdk" src="https://app.chaport.com/javascripts/insert.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}

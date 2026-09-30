import './globals.css';
import { Inter, Barlow } from 'next/font/google';
import Script from 'next/script';
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
        <Script id="chaport-live-chat" strategy="afterInteractive">
          {`(function(w,d,v3){
            w.chaportConfig = { appId: '6973d1a744b652d05aab5173' };
            if (w.chaport) return;
            v3 = w.chaport = {};
            v3._q = [];
            v3._l = {};
            v3.q = function(){ v3._q.push(arguments); };
            v3.on = function(e,fn){
              if (!v3._l[e]) v3._l[e] = [];
              v3._l[e].push(fn);
            };
            var s = d.createElement('script');
            s.type = 'text/javascript';
            s.async = true;
            s.src = 'https://app.chaport.com/javascripts/insert.js';
            var ss = d.getElementsByTagName('script')[0];
            ss.parentNode.insertBefore(s, ss);
          })(window, document);`}
        </Script>
      </body>
    </html>
  );
}

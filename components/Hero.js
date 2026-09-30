'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import HeroPanel from './HeroPanel';

const STATS = [
  ['Assets under simulation', '$4.2B'],
  ['Active investors', '182,400'],
  ['Open programs', '8'],
  ['Avg. modeled return', '+24.6%'],
];

export default function Hero() {
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const setRate = () => {
      v.playbackRate = 2;
    };
    setRate();
    v.addEventListener('loadedmetadata', setRate);
    v.addEventListener('play', setRate);
    return () => {
      v.removeEventListener('loadedmetadata', setRate);
      v.removeEventListener('play', setRate);
    };
  }, []);

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden">
      {/* Launch footage — NASA public domain, see /public/CREDITS.txt */}
      <video
        ref={videoRef}
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster="/hero-poster.jpg"
      >
        <source src="/hero.webm" type="video/webm" />
        <source src="/hero.mp4" type="video/mp4" />
      </video>
      <div className="overlay-dark absolute inset-0 -z-10" />

      <div className="container-page grid flex-1 items-center gap-12 pb-16 pt-28 lg:grid-cols-[1.05fr_0.95fr] lg:pb-20">
        <div className="animate-fade-up">
          <p className="eyebrow mb-6 flex items-center gap-2.5 text-white/70">
            <span className="live-dot" /> Live market · Eight open rounds
          </p>
          <h1 className="h1 text-[clamp(2.05rem,5.2vw,4.3rem)] uppercase tracking-[0.01em] text-white">
            Invest in the
            <br />
            company making life
            <br />
            multiplanetary
          </h1>
          <p className="body-lg mt-7 max-w-xl">
            Trade a fractional position in SpaceX and its programs — go long or short, run options,
            copy top desks, and reserve your IPO allocation. Deposit in dollars or Bitcoin and track
            every position live.
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link href="/signup" className="btn-solid">Open an investing account</Link>
            <Link href="#opportunities" className="btn-outline">View opportunities</Link>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
            {STATS.map(([label, value]) => (
              <div key={label}>
                <div className="num font-display text-[clamp(1.3rem,2.4vw,1.8rem)] font-medium leading-none text-white">
                  {value}
                </div>
                <div className="mt-1.5 text-[10px] uppercase tracking-wider text-grey-400">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade-up lg:pl-4" style={{ animationDelay: '120ms' }}>
          <HeroPanel />
        </div>
      </div>
    </section>
  );
}

import Link from 'next/link';
import Hero from '@/components/Hero';
import Reveal from '@/components/Reveal';
import VehicleSection from '@/components/VehicleSection';
import OpportunityCard from '@/components/OpportunityCard';
import ValuationChart from '@/components/ValuationChart';
import MarketTicker from '@/components/MarketTicker';
import FeaturedQuotes from '@/components/FeaturedQuotes';
import LiveActivity from '@/components/LiveActivity';
import { OPPORTUNITIES } from '@/lib/opportunities';
import {
  VEHICLES,
  STARLINK,
  VISION_POINTS,
  MILESTONES,
  THESIS,
  FAQ,
} from '@/lib/content';

const STEPS = [
  ['01', 'Open an account', 'Two fields and a password. Takes under a minute to get started.'],
  ['02', 'Fund the balance', 'Deposit into available cash. Your balance, positions and net worth are tracked separately and update instantly.'],
  ['03', 'Back a program', 'Choose across eight programs and four risk bands. Commit any amount — units are fractional.'],
  ['04', 'Hold or exit', 'Watch positions move against what you paid. Sell back to cash whenever you want, then withdraw.'],
];

export default function HomePage() {
  return (
    <div className="brand-type">
      <Hero />

      <MarketTicker />

      {/* Why SpaceX */}
      <section id="vision" className="border-t border-line py-20 sm:py-24">
        <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Reveal>
            <figure className="relative overflow-hidden rounded-xl border border-line">
              <img src="/musk.jpg" alt="Elon Musk" className="w-full grayscale" loading="lazy" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-5">
                <p className="text-[13px] font-semibold tracking-wider2 text-white">Elon Musk</p>
                <p className="text-[12px] text-grey-400">Founder, CEO & Chief Engineer</p>
              </figcaption>
            </figure>
          </Reveal>

          <Reveal delay={100}>
            <p className="eyebrow mb-5">Why SpaceX</p>
            <blockquote className="border-l-2 border-white/40 pl-5">
              <p className="font-display text-[clamp(1.5rem,3vw,2.4rem)] font-normal leading-[1.15] text-white">
                “When something is important enough, you do it even if the odds are not in your favor.”
              </p>
            </blockquote>
            <p className="body-lg mt-6 max-w-xl">
              Launch is the business; Mars is the point. Reusable rockets and Starlink throw off the cash
              that funds the hardware to make humanity multiplanetary — and every program on this platform
              is a way to hold a piece of that.
            </p>
            <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
              {VISION_POINTS.slice(0, 3).map((p) => (
                <div key={p.n} className="bg-[#0b0b0d] p-5">
                  <span className="num text-[12px] text-grey-500">{p.n}</span>
                  <h3 className="mt-2 text-[14px] font-semibold text-white">{p.title}</h3>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Live markets — compact + fancy */}
      <section id="markets" className="border-t border-line py-16 sm:py-20">
        <div className="container-page">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="eyebrow flex items-center gap-2.5"><span className="live-dot" /> Live markets</p>
            <Link href="/signup" className="btn-outline btn-sm">Trade these markets</Link>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
            <FeaturedQuotes />
            <LiveActivity rows={5} />
          </div>
        </div>
      </section>

      {/* Vehicles */}
      <div id="vehicles">
        {VEHICLES.map((v, i) => (
          <VehicleSection key={v.id} vehicle={v} index={i} />
        ))}
      </div>

      {/* Raptor / propulsion band */}
      <section className="relative border-t border-line">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[420px] overflow-hidden">
            <img src="/raptor.jpg" alt="Raptor engine test firing" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          </div>
          <div className="flex items-center bg-panel px-6 py-20 sm:px-12 lg:px-16">
            <Reveal className="max-w-lg">
              <p className="eyebrow mb-5">Propulsion</p>
              <h2 className="h2 text-white">Raptor</h2>
              <p className="body-lg mt-6">
                A full-flow staged-combustion engine burning liquid methane and oxygen — a cycle only a
                handful of engines in history have ever flown.
              </p>
              <p className="body mt-4">
                Thirty-three of them lift Super Heavy. They are built in-house, at rate, on a production
                line that treats engines as a manufactured product rather than a bespoke artefact. That
                is what makes a fully reusable vehicle economically possible.
              </p>
              <dl className="mt-9 grid grid-cols-2 gap-x-8 border-t border-line">
                {[
                  ['Cycle', 'Full-flow staged'],
                  ['Propellant', 'CH₄ / LOX'],
                  ['Engines per booster', '33'],
                  ['Reusable', 'Yes'],
                ].map(([k, v]) => (
                  <div key={k} className="border-b border-line py-3.5">
                    <dt className="text-[11px] tracking-wider2 text-grey-500">{k}</dt>
                    <dd className="mono mt-1 text-[15px] text-white">{v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Starlink */}
      <section id="starlink" className="relative border-t border-line">
        <div className="relative min-h-[92vh] overflow-hidden">
          <img src={STARLINK.image} alt="Starlink mission launch" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          <div className="overlay-dark absolute inset-0" />
          <div className="container-page relative flex min-h-[92vh] flex-col justify-center py-24">
            <Reveal className="max-w-2xl">
              <p className="eyebrow mb-5">Recurring revenue</p>
              <h2 className="h2 text-white">Starlink</h2>
              <p className="body-lg mt-6">
                Thousands of satellites in low Earth orbit delivering broadband to places terrestrial
                infrastructure was never going to reach — rural homes, ships, aircraft, disaster zones
                and front lines.
              </p>
              <p className="body mt-4">
                Because the constellation flies at roughly 550 km rather than geostationary altitude,
                latency lands in the range of terrestrial connections instead of the half-second lag
                legacy satellite internet is known for. Each subscriber is a recurring monthly
                relationship — and the launches are flown by the company's own rockets, at cost.
              </p>
            </Reveal>

            <Reveal delay={120} className="mt-14">
              <dl className="grid grid-cols-2 border-t border-line lg:grid-cols-4">
                {STARLINK.stats.map(([label, value]) => (
                  <div key={label} className="border-b border-line py-6 pr-6 lg:border-r">
                    <dd className="font-display text-[clamp(1.6rem,3vw,2.4rem)] font-medium leading-none text-white">
                      {value}
                    </dd>
                    <dt className="eyebrow mt-2">{label}</dt>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Mars band */}
      <section className="relative border-t border-line">
        <div className="relative h-[52vh] min-h-[340px] overflow-hidden">
          <img src="/mars.jpg" alt="The surface of Mars" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-black/55" />
          <div className="container-page relative flex h-full flex-col items-center justify-center text-center">
            <p className="eyebrow mb-4">Destination</p>
            <h2 className="h2 max-w-3xl text-white">
              A city, not a footprint
            </h2>
            <p className="body-lg mt-5 max-w-xl">
              Self-sustaining means it survives if the ships from Earth stop coming. That is the bar.
            </p>
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="border-t border-line py-24 sm:py-32">
        <div className="container-tight">
          <Reveal>
            <p className="eyebrow mb-6">Track record</p>
            <h2 className="h2 text-white">Two decades of firsts</h2>
          </Reveal>
          <div className="mt-14 border-t border-line">
            {MILESTONES.map(([year, text], i) => (
              <Reveal key={year} delay={i * 40}>
                <div className="grid gap-4 border-b border-line py-6 sm:grid-cols-[140px_1fr] sm:gap-10">
                  <div className="mono text-[15px] text-white">{year}</div>
                  <p className="body text-[15px]">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Investment thesis */}
      <section className="relative border-t border-line">
        <div className="grid lg:grid-cols-2">
          <div className="flex items-center bg-panel px-6 py-20 sm:px-12 lg:px-16">
            <Reveal className="max-w-lg">
              <p className="eyebrow mb-5">The opportunity</p>
              <h2 className="h2 text-white">What you get</h2>
              <p className="body-lg mt-6">
                Reported valuation marks over the last several years, illustrating the trajectory this
                platform models exposure to.
              </p>
              <ValuationChart />
              <p className="body mt-6 text-[13px] text-grey-500">
                Figures are widely reported private-round and tender marks, in USD billions, shown for
                illustration only. Past movement is not a forecast.
              </p>
            </Reveal>
          </div>
          <div className="relative min-h-[420px] overflow-hidden">
            <img src="/droneship.jpg" alt="Falcon 9 first stage on the droneship" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          </div>
        </div>

        <div className="container-page py-24">
          <div className="grid gap-px bg-white/10 md:grid-cols-2 lg:grid-cols-4">
            {THESIS.map((t) => (
              <div key={t.title} className="bg-black p-8">
                <h3 className="text-[15px] font-semibold leading-snug tracking-wide text-white">
                  {t.title}
                </h3>
                <p className="body mt-3 text-[14px]">{t.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Opportunities */}
      <section id="opportunities" className="border-t border-line py-24 sm:py-32">
        <div className="container-page">
          <Reveal className="max-w-2xl">
            <p className="eyebrow mb-6">Open programs</p>
            <h2 className="h2 text-white">Eight ways in</h2>
            <p className="body-lg mt-6">
              From weekly-cadence launch services at the low-risk end to the Mars fund at the far end of
              the curve. Every position is fractional — you set the amount.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {OPPORTUNITIES.map((opp) => (
              <OpportunityCard key={opp.id} opp={opp} href="/signup" cta="Invest" />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-line bg-panel py-24 sm:py-32">
        <div className="container-page">
          <Reveal className="max-w-2xl">
            <p className="eyebrow mb-6">How it works</p>
            <h2 className="h2 text-white">Four steps to a position</h2>
          </Reveal>
          <div className="mt-14 grid gap-px bg-white/10 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([n, title, copy]) => (
              <div key={n} className="bg-panel p-8">
                <span className="mono text-[13px] text-grey-500">{n}</span>
                <h3 className="mt-4 text-[16px] font-semibold tracking-wide text-white">{title}</h3>
                <p className="body mt-3 text-[14px]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-line py-24 sm:py-32">
        <div className="container-tight grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <p className="eyebrow mb-6">Questions</p>
            <h2 className="h2 text-white">Read this part</h2>
            <p className="body mt-5">
              Especially the first two answers.
            </p>
          </Reveal>
          <div className="border-t border-line">
            {FAQ.map((item) => (
              <details key={item.q} className="group border-b border-line py-6">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
                  <span className="text-[16px] font-medium tracking-wide text-white">
                    {item.q}
                  </span>
                  <span className="mt-1 shrink-0 text-grey-400 transition-transform duration-300 group-open:rotate-45">
                    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M8 1v14M1 8h14" />
                    </svg>
                  </span>
                </summary>
                <p className="body mt-4 max-w-2xl">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative border-t border-line">
        <div className="relative min-h-[70vh] overflow-hidden">
          <img src="/launch-streak.jpg" alt="Falcon 9 ascent" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-black/65" />
          <div className="container-page relative flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
            <p className="eyebrow mb-6">T-minus</p>
            <h2 className="h1 max-w-4xl text-white">Open your account</h2>
            <p className="body-lg mt-7 max-w-lg">
              Two minutes to set up. Fund your account and start building a position straight away.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/signup" className="btn-solid">
                Open an account
              </Link>
              <Link href="/login" className="btn-outline">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import Link from 'next/link';
import Reveal from './Reveal';

// Full-bleed vehicle feature: photograph, dark scrim, copy over it, spec table below.
export default function VehicleSection({ vehicle, index }) {
  const flip = index % 2 === 1;

  return (
    <section id={vehicle.id} className="relative border-t border-line">
      <div className="relative min-h-[86vh] overflow-hidden">
        <img
          src={vehicle.image}
          alt={vehicle.name}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div
          className={`absolute inset-0 ${flip ? 'overlay-side rotate-180' : 'overlay-side'}`}
          style={flip ? { transform: 'scaleX(-1)' } : undefined}
        />

        <div className="container-page relative flex min-h-[86vh] items-center py-24">
          <Reveal className={`w-full max-w-xl ${flip ? 'ml-auto text-left' : ''}`}>
            <p className="eyebrow mb-5">{vehicle.eyebrow}</p>
            <h2 className="h2 text-white">{vehicle.name}</h2>
            <p className="body-lg mt-6">{vehicle.lede}</p>
            <p className="body mt-4">{vehicle.body}</p>

            <dl className="mt-9 grid grid-cols-2 gap-x-8 gap-y-0 border-t border-line">
              {vehicle.specs.map(([k, v]) => (
                <div key={k} className="border-b border-line py-3.5">
                  <dt className="text-[11px] tracking-wider2 text-grey-500">{k}</dt>
                  <dd className="mono mt-1 text-[15px] text-white">{v}</dd>
                </div>
              ))}
            </dl>

            <Link href="/signup" className="btn-outline mt-9">
              Invest in {vehicle.name}
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

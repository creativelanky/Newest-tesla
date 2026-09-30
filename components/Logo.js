import Link from 'next/link';

// Brand wordmark — the SpaceX logo image. Wide, light-stroke artwork built for
// dark backgrounds; rendered at a fixed height with auto width. Pass a Tailwind
// height class via `height` (e.g. "h-8") to size it per surface.
export default function Logo({ href = '/', className = '', height = 'h-6 sm:h-7' }) {
  return (
    <Link href={href} className={`inline-flex items-center ${className}`} aria-label="SpaceX Invest — home">
      <img src="/logo.png" alt="SpaceX Invest" className={`${height} w-auto`} />
    </Link>
  );
}

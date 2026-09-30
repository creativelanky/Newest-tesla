import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-20 text-center">
      <div>
        <p className="mono text-[13px] text-grey-500">Error — loss of signal</p>
        <h1 className="h1 mt-3 text-white">404</h1>
        <p className="body-lg mx-auto mt-4 max-w-sm">
          This trajectory doesn't exist. The page may have drifted off course.
        </p>
        <Link href="/" className="btn-solid mt-9">
          Return to the launchpad
        </Link>
      </div>
    </div>
  );
}

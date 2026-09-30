'use client';

import Spinner from './Spinner';

// Action button with a built-in loading state. Pass your usual button classes
// (btn-solid, btn-scarlet, btn-sm, …) via className. While `loading`, it shows
// a spinner, keeps the label for stable width, and is disabled so the action
// can't be double-fired.
export default function Button({
  loading = false,
  disabled = false,
  children,
  className = 'btn-solid',
  type = 'button',
  spinnerClassName = 'h-4 w-4',
  ...rest
}) {
  return (
    <button type={type} disabled={disabled || loading} className={className} aria-busy={loading} {...rest}>
      {loading && <Spinner className={spinnerClassName} />}
      {children}
    </button>
  );
}

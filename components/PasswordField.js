'use client';

import { useState } from 'react';
import { IconEye, IconEyeOff } from './DeskIcons';

// Password input with a show/hide eye toggle.
export default function PasswordField({ value, onChange, id = 'password', placeholder = '••••••••', autoComplete = 'current-password' }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        className="input pr-11"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-grey-500 transition-colors hover:text-white"
      >
        {show ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
      </button>
    </div>
  );
}

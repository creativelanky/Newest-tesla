'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUp, logIn } from '@/lib/store';
import { COUNTRIES } from '@/lib/countries';
import PasswordField from './PasswordField';
import Button from './Button';

const EMPTY = { name: '', email: '', phone: '', country: '', city: '', password: '' };

export default function AuthForm({ mode }) {
  const isSignup = mode === 'signup';
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    setError('');
  }

  async function submit(e) {
    e.preventDefault();
    if (isSignup) {
      if (!form.name.trim()) return setError('Enter your name.');
      if (!form.phone.trim()) return setError('Enter your phone number.');
      if (!form.country) return setError('Select your country.');
      if (!form.city.trim()) return setError('Enter your city.');
    }
    if (!form.email.trim() || !form.email.includes('@')) return setError('Enter a valid email address.');
    if (form.password.length < 4) return setError('Password must be at least 4 characters.');

    setBusy(true);
    const res = isSignup
      ? await signUp({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim(),
          country: form.country,
          city: form.city.trim(),
        })
      : await logIn({ email: form.email.trim(), password: form.password });
    setBusy(false);

    if (!res.ok) return setError(res.error);
    if (res.needsEmailConfirm) return setCheckEmail(true);
    router.push('/dashboard');
  }

  if (checkEmail) {
    return (
      <section className="grid min-h-screen place-items-center px-6">
        <div className="w-full max-w-[420px] text-center animate-fade-up">
          <p className="eyebrow mb-4">Almost there</p>
          <h2 className="h2 text-white">Confirm your email</h2>
          <p className="body mt-4">
            We sent a confirmation link to <span className="text-white">{form.email}</span>. Click it to
            activate your account, then log in.
          </p>
          <Link href="/login" className="btn-solid mt-8 inline-flex w-full justify-center">
            Go to login
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="grid min-h-screen lg:grid-cols-2">
      {/* Media panel */}
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src={isSignup ? '/falcon9-launch.jpg' : '/starbase.jpg'}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative flex h-full flex-col justify-end p-12 xl:p-16">
          <p className="eyebrow mb-5">{isSignup ? 'Open an account' : 'Welcome back'}</p>
          <h1 className="h2 max-w-md text-white">
            {isSignup ? 'Every program, one balance' : 'Return to the console'}
          </h1>
          <p className="body-lg mt-5 max-w-sm">
            {isSignup
              ? 'Falcon 9, Falcon Heavy, Dragon, Starship, Raptor, Starshield, Starlink and the Mars fund.'
              : 'Check your positions, move money, and adjust your exposure.'}
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-16 sm:px-12">
        <div className="w-full max-w-[440px] animate-fade-up">
          <p className="eyebrow mb-4">{isSignup ? 'Registration' : 'Sign in'}</p>
          <h2 className="h2 text-white">{isSignup ? 'Create account' : 'Log in'}</h2>
          <p className="body mt-4">
            {isSignup
              ? 'A few details to set up and secure your account.'
              : 'Enter your details to reach your dashboard.'}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            {isSignup && (
              <div>
                <label className="label" htmlFor="name">Full name</label>
                <input
                  id="name"
                  className="input"
                  placeholder="Ada Lovelace"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>

            {isSignup && (
              <>
                <div>
                  <label className="label" htmlFor="phone">Phone number</label>
                  <input
                    id="phone"
                    type="tel"
                    className="input"
                    placeholder="+1 555 010 0100"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label" htmlFor="country">Country</label>
                    <select
                      id="country"
                      className="input"
                      value={form.country}
                      onChange={(e) => update('country', e.target.value)}
                    >
                      <option value="" disabled>Select</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="city">City</label>
                    <input
                      id="city"
                      className="input"
                      placeholder="e.g. Austin"
                      value={form.city}
                      onChange={(e) => update('city', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="label" htmlFor="password">Password</label>
              <PasswordField
                id="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
            </div>

            {error && (
              <p className="border border-loss/40 bg-loss/10 px-4 py-3 text-[13px] text-loss">{error}</p>
            )}

            <Button type="submit" loading={busy} className="btn-solid w-full">
              {isSignup ? 'Create account' : 'Log in'}
            </Button>
          </form>

          <p className="mt-8 text-[13px] tracking-wide text-grey-500">
            {isSignup ? 'Already registered? ' : 'No account yet? '}
            <Link href={isSignup ? '/login' : '/signup'} className="link-underline">
              {isSignup ? 'Log in' : 'Create one'}
            </Link>
          </p>

          <p className="mt-8 border-t border-line pt-6 text-[12px] leading-relaxed text-grey-600">
            Your details are kept private and used only to secure your account.
          </p>
        </div>
      </div>
    </section>
  );
}

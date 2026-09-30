'use client';

import { logOut } from '@/lib/store';
import { openSupport } from '@/lib/support';
import { IconChat } from './DeskIcons';

// Full-screen lockout shown to suspended accounts on every authed surface
// except /support. Money movement and trading are already blocked server-side;
// this removes the UI too and points the user at the one thing they can do —
// message support. `reason` is the admin-set explanation (may be empty).
export default function SuspendedScreen({ reason }) {
  return (
    <div className="app-shell grid min-h-screen place-items-center px-6 py-24">
      <div className="w-full max-w-lg text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-loss/40 bg-loss/10 text-[30px] font-semibold text-loss">
          !
        </span>

        <h1 className="mt-7 font-sans text-[clamp(1.8rem,4vw,2.4rem)] font-bold tracking-tight text-white">
          Your account has been suspended
        </h1>

        <p className="mt-4 text-[15px] leading-relaxed text-grey-400">
          Access to your dashboard, deposits, withdrawals and trading is paused while your account is
          under review. You can still reach our team below.
        </p>

        {reason ? (
          <div className="mt-7 rounded-xl border border-loss/30 bg-loss/[0.07] p-5 text-left">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-loss">Reason</div>
            <p className="mt-2 text-[15px] leading-relaxed text-grey-100">{reason}</p>
          </div>
        ) : (
          <div className="mt-7 rounded-xl border border-line bg-card2 p-5 text-left">
            <p className="text-[14px] leading-relaxed text-grey-300">
              No specific reason was provided. Contact support for details on your account.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-3">
          <button onClick={openSupport} className="btn-scarlet btn-sm w-full max-w-xs gap-2">
            <IconChat className="h-4 w-4" /> Message support
          </button>
          <button
            onClick={() => logOut()}
            className="text-[13px] tracking-wide text-grey-500 transition-colors hover:text-white"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

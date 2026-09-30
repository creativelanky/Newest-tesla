'use client';

// Thin fetch wrappers around the server routes in app/api/**. Every call
// carries the Supabase session cookie automatically (same-origin), and every
// mutation is authorized again server-side — nothing here is trusted.
export async function call(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: body.error || `Request failed (${res.status})` };
  return { ok: true, data: body.data };
}

const post = (url, body) => call(url, { method: 'POST', body: JSON.stringify(body || {}) });
const del = (url) => call(url, { method: 'DELETE' });

// ---- Signed-in user ------------------------------------------------------

export const fetchMe = () => call('/api/me');
export const fetchNotifications = () => call('/api/notifications');
export const markNotificationsRead = () => post('/api/notifications/read');
export const apiSendNotification = (payload) => post('/api/admin/notify', payload);

// Postgres columns are snake_case; the desk UI (built against the old
// localStorage shape) expects camelCase — normalise once here.
export async function fetchSettings() {
  const res = await call('/api/settings');
  if (!res.ok) return res;
  const s = res.data;
  return {
    ok: true,
    data: {
      btcAddress: s.btc_address,
      btcNetwork: s.btc_network,
      paypalEmail: s.paypal_email,
      bankName: s.bank_name,
      bankAccountName: s.bank_account_name,
      bankAccountNumber: s.bank_account_number,
      bankRouting: s.bank_routing,
      bankSwift: s.bank_swift,
      minDeposit: Number(s.min_deposit),
      supportName: s.support_name,
    },
  };
}
export const apiDeposit = (payload) => post('/api/wallet/deposit', payload);
export const apiWithdraw = (payload) => post('/api/wallet/withdraw', payload);
export const apiSubmitKyc = (docs) => post('/api/kyc/submit', { docs });

// ---- Admin -----------------------------------------------------------------

export const fetchAdminOverview = () => call('/api/admin/overview');
export const apiApproveRequest = (id, note) => post(`/api/admin/requests/${id}/approve`, { note });
export const apiRejectRequest = (id, note) => post(`/api/admin/requests/${id}/reject`, { note });
export const apiRevertRequest = (id) => post(`/api/admin/requests/${id}/revert`);
export const apiSetAccountFigures = (id, depositTotal, profit) =>
  post(`/api/admin/users/${id}/account`, { depositTotal, profit });
export const apiSetStatus = (id, status, reason) => post(`/api/admin/users/${id}/status`, { status, reason });
export const apiDecideKyc = (id, status, note) => post(`/api/admin/kyc/${id}/decide`, { status, note });
export const apiSaveSettings = (patch) => post('/api/admin/settings', patch);
export const apiDeleteUser = (id) => del(`/api/admin/users/${id}`);

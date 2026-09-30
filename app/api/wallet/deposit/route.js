import { getSessionUser, unauthorized, badRequest, ok } from '@/lib/supabase/guards';
import { supabaseServer } from '@/lib/supabase/server';
import { uploadDataUrl } from '@/lib/supabase/upload-server';

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { method, amount, reference, receipt } = await req.json();
  if (!method || !(Number(amount) > 0)) return badRequest('Enter a method and amount.');

  let receiptPath = null;
  if (receipt?.dataUrl) {
    const ext = receipt.type === 'application/pdf' ? 'pdf' : 'jpg';
    receiptPath = await uploadDataUrl('receipts', `${user.id}/${Date.now()}.${ext}`, receipt.dataUrl);
  }

  // Runs as the caller via the RLS-scoped server client — request_deposit()
  // uses auth.uid() internally, so there's no way to submit on someone
  // else's behalf even if the client lied about who they are.
  const { data, error } = await supabaseServer().rpc('request_deposit', {
    p_method: method,
    p_amount: amount,
    p_reference: reference || '',
    p_receipt_url: receiptPath,
  });

  if (error) return badRequest(error.message);
  return ok(data);
}

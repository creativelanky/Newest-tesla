import { getSessionUser, unauthorized, badRequest, ok } from '@/lib/supabase/guards';
import { supabaseServer } from '@/lib/supabase/server';
import { uploadDataUrl } from '@/lib/supabase/upload-server';

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { docs } = await req.json(); // [{ docType, side, dataUrl, type }]
  if (!Array.isArray(docs) || docs.length === 0) return badRequest('Attach at least one document.');

  const uploaded = await Promise.all(
    docs.map(async (d, i) => {
      const ext = d.type === 'application/pdf' ? 'pdf' : 'jpg';
      const path = await uploadDataUrl('kyc-docs', `${user.id}/${Date.now()}-${i}.${ext}`, d.dataUrl);
      return { doc_type: d.docType, side: d.side, file_url: path };
    })
  );

  const { error } = await supabaseServer().rpc('submit_kyc', { p_docs: uploaded });
  if (error) return badRequest(error.message);
  return ok({ submitted: uploaded.length });
}

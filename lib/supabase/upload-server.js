import { supabaseAdmin } from './server';

// Uploads a data-URL (already compressed client-side by lib/upload.js) to a
// private Storage bucket and returns the bucket-relative path. Callers store
// that path in Postgres and mint short-lived signed URLs to display it.
export async function uploadDataUrl(bucket, path, dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) throw new Error('Invalid file data.');
  const [, contentType, base64] = match;
  const bytes = Buffer.from(base64, 'base64');

  const { error } = await supabaseAdmin()
    .storage.from(bucket)
    .upload(path, bytes, { contentType, upsert: true });
  if (error) throw new Error(error.message);

  return path;
}

export async function signedUrl(bucket, path, expiresIn = 60 * 60) {
  if (!path) return null;
  const { data, error } = await supabaseAdmin()
    .storage.from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error) return null;
  return data.signedUrl;
}

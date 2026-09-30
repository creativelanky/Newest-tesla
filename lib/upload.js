'use client';

// Reads an image/PDF file into a compact data URL for local storage.
// Images are downscaled and re-encoded so a handful of receipts and ID
// documents comfortably fit inside the browser's storage quota.
const MAX_EDGE = 1100;
const QUALITY = 0.62;
const MAX_RAW = 6 * 1024 * 1024; // reject very large originals up front

export function readFileAsDoc(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file selected.'));
    if (file.size > MAX_RAW) {
      return reject(new Error('That file is larger than 6 MB. Please attach a smaller one.'));
    }

    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const raw = reader.result;
      if (!isImage) {
        // Non-images (e.g. PDF) are stored as-is.
        return resolve({ name: file.name, type: file.type, dataUrl: raw, size: file.size });
      }

      const img = new Image();
      img.onerror = () => reject(new Error('That image could not be processed.'));
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
        resolve({ name: file.name, type: 'image/jpeg', dataUrl, size: dataUrl.length });
      };
      img.src = raw;
    };
    reader.readAsDataURL(file);
  });
}

export function prettySize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

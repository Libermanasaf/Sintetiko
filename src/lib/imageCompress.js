// Client-side image compression before upload. Phones produce 3–12 MB photos;
// uploading them as-is fills Storage (1 GB cap) and wastes egress on every view.
// We downscale to a sane max width and re-encode as JPEG ~80% — visually
// identical on screen, ~90% smaller. No external dependency (Canvas only).
//
// Returns a File (compressed) or the ORIGINAL file if anything goes wrong or the
// input isn't a raster image (e.g. already tiny, or a non-image) — never throws.

const MAX_WIDTH = 1600;
const QUALITY = 0.8;

export async function compressImage(file) {
  try {
    if (!file || !file.type?.startsWith('image/')) return file;
    // Skip if already small (< 400 KB) — not worth re-encoding.
    if (file.size < 400 * 1024) return file;

    const bitmap = await loadBitmap(file);
    const scale = Math.min(1, MAX_WIDTH / bitmap.width);
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, w, h);
    if (bitmap.close) bitmap.close();

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY)
    );
    if (!blob || blob.size >= file.size) return file; // no gain → keep original

    const name = (file.name || 'photo').replace(/\.\w+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg' });
  } catch {
    return file; // fail-soft: upload the original rather than block the user
  }
}

// Prefer createImageBitmap (fast, handles EXIF orientation in modern browsers);
// fall back to an <img> element.
async function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch { /* fall through */ }
  }
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

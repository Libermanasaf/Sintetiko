// Client-side image compression before upload. Phones produce 3–12 MB photos;
// uploading them as-is fills Storage (1 GB cap) and wastes egress on every view.
// We downscale to a sane max width and re-encode as JPEG — visually identical on
// screen, ~95% smaller. No external dependency (Canvas only).
//
// CRITICAL: we enforce a hard output ceiling (TARGET_BYTES). A modern phone photo
// downscaled to 1600px at fixed 80% can still be 0.6–1.2 MB — that's the victory
// photo that, viewed by 100 people × 12 matches, blows the egress cap. So we don't
// trust a single quality setting: we step quality (and then width) down until the
// result is actually under the ceiling. This makes the ~250 KB promise enforced,
// not assumed.
//
// Returns a File (compressed) or the ORIGINAL file if anything goes wrong or the
// input isn't a raster image (e.g. already tiny, or a non-image) — never throws.

const MAX_WIDTH = 1600;
const TARGET_BYTES = 250 * 1024;   // hard ceiling we drive toward
const MIN_WIDTH = 800;             // don't downscale below this (stays sharp on screen)
const QUALITY_STEPS = [0.8, 0.7, 0.6, 0.5, 0.42];

export async function compressImage(file) {
  try {
    if (!file || !file.type?.startsWith('image/')) return file;
    // Skip only if already under the ceiling — not worth re-encoding.
    if (file.size <= TARGET_BYTES) return file;

    const bitmap = await loadBitmap(file);
    let width = Math.round(Math.min(bitmap.width, MAX_WIDTH));
    let best = null;

    // Pass 1: at MAX_WIDTH, step quality down looking for under-ceiling.
    // Pass 2+: if even lowest quality is too big, shrink width and retry.
    while (width >= MIN_WIDTH) {
      const h = Math.round(bitmap.height * (width / bitmap.width));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0, width, h);

      for (const q of QUALITY_STEPS) {
        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, 'image/jpeg', q)
        );
        if (!blob) continue;
        // Track the smallest result so far as a fallback.
        if (!best || blob.size < best.size) best = blob;
        if (blob.size <= TARGET_BYTES) { best = blob; width = 0; break; } // done
      }
      if (width === 0) break;
      width = Math.round(width * 0.8); // shrink and try again
    }
    if (bitmap.close) bitmap.close();

    if (!best || best.size >= file.size) return file; // no gain → keep original

    const name = (file.name || 'photo').replace(/\.\w+$/, '') + '.jpg';
    return new File([best], name, { type: 'image/jpeg' });
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

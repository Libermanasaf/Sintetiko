// Regenerate PWA icons from public/logo-source.png (user's designed logo)
// Pads the landscape source to a square with the matching dark background so
// the full wordmark stays visible on the home screen.
// Usage: node scripts/generate-icons.mjs
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, '..', 'public');
const SOURCE = path.join(PUBLIC, 'logo-source.png');

// Background that matches the logo canvas (deep black with subtle warmth)
const BG = { r: 8, g: 8, b: 8, alpha: 1 };

const targets = [
  { file: 'icon-192.png',         size: 192 },
  { file: 'icon-512.png',         size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
];

for (const { file, size } of targets) {
  await sharp(SOURCE)
    .resize(size, size, {
      fit: 'contain',
      background: BG,
    })
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC, file));
  console.log(`✓ ${file} (${size}x${size})`);
}

console.log('All icons generated from logo-source.png');

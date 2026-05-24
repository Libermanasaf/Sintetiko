// Regenerate PWA icons from public/logo-source.png (user's designed logo)
// Trims the surrounding empty background to the logo's bounding box,
// then re-pads to a square with a small breathing margin so the logo
// fills the home-screen icon nicely without touching the edges.
// Usage: node scripts/generate-icons.mjs
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, '..', 'public');
const SOURCE = path.join(PUBLIC, 'logo-source.png');

// Background that matches the logo canvas (deep black)
const BG = { r: 8, g: 8, b: 8, alpha: 1 };

const targets = [
  { file: 'icon-192.png',         size: 192 },
  { file: 'icon-512.png',         size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
];

// 1. Trim the empty background around the logo content (aggressive threshold
//    because the source has a subtle gradient, not pure black)
const trimmedBuf = await sharp(SOURCE).trim({ threshold: 50 }).toBuffer();
const meta = await sharp(trimmedBuf).metadata();
console.log(`Logo bounding box: ${meta.width}x${meta.height}`);

// 2. Pad to a square with a small breathing margin (4% of longest edge)
const longest = Math.max(meta.width, meta.height);
const pad = Math.round(longest * 0.04);
const square = longest + pad * 2;
const offsetX = Math.floor((square - meta.width) / 2);
const offsetY = Math.floor((square - meta.height) / 2);

const squareBuf = await sharp(trimmedBuf)
  .extend({
    top: offsetY,
    bottom: square - meta.height - offsetY,
    left: offsetX,
    right: square - meta.width - offsetX,
    background: BG,
  })
  .toBuffer();

// 3. Emit each target size
for (const { file, size } of targets) {
  await sharp(squareBuf)
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(path.join(PUBLIC, file));
  console.log(`✓ ${file} (${size}x${size})`);
}

console.log('All icons generated from logo-source.png');

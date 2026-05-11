/**
 * Converts PNG app screenshots to WebP for better compression.
 * Run once: node scripts/convert-images.mjs
 */
import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMG = join(__dirname, '..', 'public', 'images');

const files = ['hero', '1', '2', '3', '4', '5'];

for (const name of files) {
  const src = join(IMG, `${name}.png`);
  const out = join(IMG, `${name}.webp`);
  const info = await sharp(src).webp({ quality: 85 }).toFile(out);
  const orig = (await import('fs')).statSync(src).size;
  const savings = (((orig - info.size) / orig) * 100).toFixed(0);
  console.log(`✓ ${name}.webp  ${(orig/1024).toFixed(0)}KB → ${(info.size/1024).toFixed(0)}KB  (-${savings}%)`);
}

console.log('Done.');

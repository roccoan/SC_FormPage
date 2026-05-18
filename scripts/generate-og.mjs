// Generates og-default.jpg (homepage OG fallback). Run once: node scripts/generate-og.mjs
import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'images');
const W = 1200, H = 630;

function escXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0f1a"/>
      <stop offset="100%" stop-color="#001c4a"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="80" y="130" width="6" height="148" rx="3" fill="#0891b2"/>
  <text x="108" y="196" font-size="72" font-weight="bold" font-family="system-ui,sans-serif" fill="white">Screening Clearing</text>
  <text x="108" y="252" font-size="28" font-family="system-ui,sans-serif" fill="#94a3b8">${escXml('Track your health screenings. Free iOS & Android app.')}</text>
  <rect x="80" y="${H - 72}" width="28" height="28" rx="6" fill="#0891b2"/>
  <line x1="94" y1="${H - 72 + 6}" x2="94" y2="${H - 72 + 22}" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="86" y1="${H - 72 + 14}" x2="102" y2="${H - 72 + 14}" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
  <text x="118" y="${H - 52}" font-size="22" font-weight="600" font-family="system-ui,sans-serif" fill="#f1f5f9">screeningclearing.com</text>
</svg>`;

await mkdir(OUT, { recursive: true });
await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(join(OUT, 'og-default.jpg'));
console.log('✓ og-default.jpg');

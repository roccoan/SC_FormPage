/**
 * Generates OG images (1200×630) for the site.
 * Uses sharp to composite SVG overlays onto a dark gradient background.
 * Run once: node scripts/generate-og.mjs
 */
import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_BASE = join(__dirname, '..', 'public', 'images');

const W = 1200;
const H = 630;

const images = [
  {
    out: 'og-default.jpg',
    title: 'Screening Clearing',
    subtitle: 'Track your health screenings. Free iOS & Android app.',
  },
  {
    out: 'blog/health-screening-guide-adults.jpg',
    title: 'Health Screening\nby Age',
    subtitle: 'What adults actually need to know — by decade.',
  },
  {
    out: 'blog/how-often-colonoscopy.jpg',
    title: 'How Often Should\nYou Get a Colonoscopy?',
    subtitle: 'Current guidelines, intervals, and what changes things.',
  },
  {
    out: 'blog/why-over-screening-harmful.jpg',
    title: 'Why Over-Screening\nCan Do More Harm Than Good',
    subtitle: 'The evidence on overdiagnosis and false positives.',
  },
  {
    out: 'blog/health-data-privacy-phone.jpg',
    title: 'Why Your Health Data\nShould Never Leave Your Phone',
    subtitle: 'Local-only storage explained — and why it matters.',
  },
  {
    out: 'blog/screening-vs-symptoms.jpg',
    title: 'Screening vs. Symptoms',
    subtitle: 'Understanding the difference — and when each applies.',
  },
];

function buildSvg(title, subtitle) {
  const lines = title.split('\n');
  const lineH = 72;
  const startY = 220 - ((lines.length - 1) * lineH) / 2;

  const titleSvg = lines
    .map(
      (line, i) =>
        `<text x="80" y="${startY + i * lineH}" font-size="64" font-weight="bold" font-family="system-ui,sans-serif" fill="white" dominant-baseline="auto">${escXml(line)}</text>`
    )
    .join('');

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0f1a"/>
      <stop offset="100%" stop-color="#001c4a"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <!-- accent bar -->
  <rect x="80" y="${startY - 90}" width="6" height="${lines.length * lineH + 4}" rx="3" fill="#0891b2"/>
  ${titleSvg}
  <text x="80" y="${startY + lines.length * lineH + 32}" font-size="28" font-family="system-ui,sans-serif" fill="#94a3b8">${escXml(subtitle)}</text>
  <!-- wordmark -->
  <rect x="80" y="${H - 72}" width="28" height="28" rx="6" fill="#0891b2"/>
  <line x1="94" y1="${H - 72 + 6}" x2="94" y2="${H - 72 + 22}" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="86" y1="${H - 72 + 14}" x2="102" y2="${H - 72 + 14}" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
  <text x="118" y="${H - 52}" font-size="22" font-weight="600" font-family="system-ui,sans-serif" fill="#f1f5f9">Screening Clearing</text>
</svg>`;
}

function escXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

await mkdir(join(OUT_BASE, 'blog'), { recursive: true });

for (const img of images) {
  const outPath = join(OUT_BASE, img.out);
  const svg = buildSvg(img.title, img.subtitle);
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 90 })
    .toFile(outPath);
  console.log('✓', img.out);
}

console.log('Done.');

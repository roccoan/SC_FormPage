/**
 * Fetches Pexels photos for blog articles, resizes to 1200×630 OG format.
 *
 * Usage:
 *   PEXELS_API_KEY=xxx node scripts/fetch-image.mjs
 *     → generates all missing blog images
 *
 *   PEXELS_API_KEY=xxx node scripts/fetch-image.mjs --slug dental-check-frequency --query "dental examination dentist"
 *     → generates/regenerates one image
 */
import sharp from 'sharp';
import { mkdir, readdir, readFile, access, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = join(__dirname, '..', 'src', 'content', 'blog');
const OUT_DIR = join(__dirname, '..', 'public', 'images', 'blog');
const CREDITS_FILE = join(OUT_DIR, 'credits.json');

const PEXELS_KEY = process.env.PEXELS_API_KEY;
if (!PEXELS_KEY) {
  console.error('Error: PEXELS_API_KEY env var required. Get one free at pexels.com/api');
  process.exit(1);
}

// Curated search queries for existing articles
const QUERY_MAP = {
  'mammogram-age-frequency': 'mammogram breast cancer screening',
  'blood-pressure-check-frequency': 'blood pressure measurement doctor',
  'cervical-cancer-screening-frequency': 'women doctor appointment healthcare consultation',
  'eye-exam-adults-frequency': 'eye examination optometrist',
  'skin-cancer-screening-frequency': 'dermatologist examining patient skin clinical', // use --photo-id 5701545 for the curated pick
  'dental-check-frequency': 'dental examination dentist',
  'how-often-blood-test-adults': 'blood test medical laboratory',
  'how-often-colonoscopy': 'colonoscopy gastroenterology medical',
  'health-screening-guide-adults': 'adult patient doctor office appointment',
  'why-over-screening-harmful': 'medical test results doctor patient',
  'health-data-privacy-phone': 'smartphone health app',
  'screening-vs-symptoms': 'medical checkup doctor stethoscope',
  'health-anxiety-and-screening': 'calm meditation wellness mindfulness',
};

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^(\w+):\s*"?(.+?)"?\s*$/);
    if (m) fm[m[1]] = m[2];
    // parse keywords array first element
    const kwMatch = line.match(/^keywords:\s*\["?([^",[]+)/);
    if (kwMatch && !fm.keywords) fm.keywords = kwMatch[1].trim();
  }
  return fm;
}

async function searchPexels(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape&size=large`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (!res.ok) throw new Error(`Pexels API error: ${res.status} ${res.statusText}`);
  const data = await res.json();
  if (!data.photos?.length) throw new Error(`No results for query: "${query}"`);
  return data.photos[0];
}

async function fetchPexelsById(id) {
  const url = `https://api.pexels.com/v1/photos/${id}`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (!res.ok) throw new Error(`Pexels API error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function processImage(slug, query) {
  const jpg = join(OUT_DIR, `${slug}.jpg`);
  const webp = join(OUT_DIR, `${slug}.webp`);

  console.log(`→ ${slug} — searching: "${query}"`);
  const photo = await searchPexels(query);
  const srcUrl = photo.src.large2x || photo.src.large || photo.src.original;

  console.log(`  downloading from Pexels (photo ${photo.id} by ${photo.photographer})`);
  const buf = await downloadBuffer(srcUrl);

  await sharp(buf)
    .resize(1200, 630, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(jpg);

  await sharp(buf)
    .resize(1200, 630, { fit: 'cover', position: 'attention' })
    .webp({ quality: 78, effort: 6 })
    .toFile(webp);

  const jpgStat = (await import('fs')).statSync(jpg);
  const webpStat = (await import('fs')).statSync(webp);
  console.log(`  ✓ ${slug}.jpg (${Math.round(jpgStat.size / 1024)}KB) + .webp (${Math.round(webpStat.size / 1024)}KB)`);

  return {
    slug,
    photographer: photo.photographer,
    photographer_url: photo.photographer_url,
    pexels_url: photo.url,
    photo_id: photo.id,
  };
}

async function loadCredits() {
  try {
    const raw = await readFile(CREDITS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function saveCredits(credits) {
  await writeFile(CREDITS_FILE, JSON.stringify(credits, null, 2) + '\n');
}

// --- main ---

await mkdir(OUT_DIR, { recursive: true });

// parse CLI args
const args = process.argv.slice(2);
const slugIdx = args.indexOf('--slug');
const queryIdx = args.indexOf('--query');
const photoIdIdx = args.indexOf('--photo-id');
const targetSlug = slugIdx >= 0 ? args[slugIdx + 1] : null;
const targetQuery = queryIdx >= 0 ? args[queryIdx + 1] : null;
const targetPhotoId = photoIdIdx >= 0 ? args[photoIdIdx + 1] : null;

const credits = await loadCredits();

if (targetSlug) {
  let photo;
  if (targetPhotoId) {
    console.log(`→ ${targetSlug} — fetching photo ID ${targetPhotoId}`);
    photo = await fetchPexelsById(targetPhotoId);
  } else {
    const query = targetQuery || QUERY_MAP[targetSlug];
    if (!query) {
      console.error(`Error: --query required for slug "${targetSlug}" (not in QUERY_MAP)`);
      process.exit(1);
    }
    console.log(`→ ${targetSlug} — searching: "${query}"`);
    photo = await searchPexels(query);
  }

  const srcUrl = photo.src.large2x || photo.src.large || photo.src.original;
  console.log(`  downloading from Pexels (photo ${photo.id} by ${photo.photographer})`);
  const buf = await downloadBuffer(srcUrl);

  const jpg = join(OUT_DIR, `${targetSlug}.jpg`);
  const webp = join(OUT_DIR, `${targetSlug}.webp`);
  await sharp(buf).resize(1200, 630, { fit: 'cover', position: 'attention' }).jpeg({ quality: 82, mozjpeg: true }).toFile(jpg);
  await sharp(buf).resize(1200, 630, { fit: 'cover', position: 'attention' }).webp({ quality: 78, effort: 6 }).toFile(webp);

  const jpgStat = (await import('fs')).statSync(jpg);
  const webpStat = (await import('fs')).statSync(webp);
  console.log(`  ✓ ${targetSlug}.jpg (${Math.round(jpgStat.size / 1024)}KB) + .webp (${Math.round(webpStat.size / 1024)}KB)`);

  credits[targetSlug] = { slug: targetSlug, photographer: photo.photographer, photographer_url: photo.photographer_url, pexels_url: photo.url, photo_id: photo.id };
} else {
  // batch mode — process all missing articles
  const files = (await readdir(BLOG_DIR)).filter(f => f.endsWith('.mdx'));
  let generated = 0;

  for (const file of files) {
    const content = await readFile(join(BLOG_DIR, file), 'utf8');
    const fm = parseFrontmatter(content);
    if (!fm.slug) continue;

    const jpg = join(OUT_DIR, `${fm.slug}.jpg`);
    const webp = join(OUT_DIR, `${fm.slug}.webp`);
    if (await exists(jpg) && await exists(webp)) {
      console.log(`– ${fm.slug} (exists, skipping)`);
      continue;
    }

    const query = QUERY_MAP[fm.slug] || fm.keywords || fm.title;
    if (!query) {
      console.warn(`  ⚠ skipping ${fm.slug} — no query available`);
      continue;
    }

    try {
      const credit = await processImage(fm.slug, query);
      credits[fm.slug] = credit;
      generated++;
      // be polite to Pexels API
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`  ✗ ${fm.slug}: ${err.message}`);
    }
  }

  console.log(`\nDone. Generated ${generated} new images.`);
}

await saveCredits(credits);
console.log(`Credits saved to public/images/blog/credits.json`);

/**
 * Turns `photos/` into a gallery: a WebP ladder per photograph, and a manifest written into
 * the built HTML.
 *
 * Run after `vite build`, or via `npm run gallery`, or by the Pages workflow on every push.
 * Nothing it writes is committed — the variants live in the published artifact, because a
 * repository that stores both the originals and four sizes of each grows twice as fast as
 * it needs to and Pages stops publishing at about a gigabyte.
 *
 *   npm run gallery
 */

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const PHOTOS = path.resolve('photos');
const DIST = path.resolve('dist');
const SITE_FILE = path.resolve('site.txt');

/** Long-edge widths, mirroring src/lib/types.ts. Never upscaled. */
const VARIANT_WIDTHS = [400, 800, 1600, 2400];

/**
 * Quality per rung. The top one is higher on purpose: it is the largest thing anyone can be
 * served, so it is the one a large screen actually sees. The rest are the same picture at a
 * size where the difference does not survive the downscale.
 */
const QUALITY_TOP = 92;
const QUALITY = 86;

const SOURCES = /\.(jpe?g|png|webp|avif|tiff?|gif)$/i;

/**
 * `01-sunrise-over-the-bay-solo.jpg` -> 'solo'. Default `wide`, which is the middle and the
 * one you want most of the time.
 *
 * The same convention the PHP edition of this project uses, deliberately: someone who has
 * read either README should not have to learn a second set of rules.
 */
function classFromName(file) {
  const name = path.parse(file).name.toLowerCase();
  for (const sizeClass of ['solo', 'tight']) {
    if (new RegExp(`(^|[-_ ])${sizeClass}$`).test(name)) return sizeClass;
  }
  return 'wide';
}

/** `01_Sunrise-over-the-bay-solo.jpg` -> "Sunrise over the bay". A camera dump gives "". */
function altFromName(file) {
  let name = path.parse(file).name;
  name = name.replace(/^\d+[-_. ]+/, ''); // ordering prefix
  name = name.replace(/[-_ ](solo|wide|tight)$/i, ''); // class suffix
  name = name.replace(/[-_]+/g, ' ').trim();

  // IMG_4821, DSC00193 and friends are noise, and noise is worse than an empty alt.
  if (name === '' || /^(img|dsc|dscn|p|pxl|screenshot)[\s_-]*\d+$/i.test(name)) return '';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * A filename safe in a URL, and still recognisably yours.
 *
 * Collisions are resolved rather than allowed to overwrite: two files that differ only by
 * characters this strips would otherwise silently become one photograph.
 */
function slugFor(file, taken) {
  const base =
    path
      .parse(file)
      .name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'photo';

  let slug = base;
  let n = 2;
  while (taken.has(slug)) slug = `${base}-${n++}`;
  taken.add(slug);
  return slug;
}

/** Line 1 is the name, line 2 is the contact. Both may be empty. */
async function readSite() {
  try {
    const lines = (await readFile(SITE_FILE, 'utf8')).split('\n');
    return { name: (lines[0] ?? '').trim(), contact: (lines[1] ?? '').trim() };
  } catch {
    return { name: '', contact: '' };
  }
}

async function main() {
  const entries = (await readdir(PHOTOS).catch(() => []))
    .filter((file) => SOURCES.test(file) && !file.startsWith('.'))
    // Filename order IS gallery order, which is why the `01-` prefix convention exists.
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

  const images = [];
  const taken = new Set();
  let written = 0;
  let bytes = 0;

  for (const file of entries) {
    const source = path.join(PHOTOS, file);
    const image = sharp(source, { failOn: 'none' });
    const meta = await image.metadata();

    // EXIF can say a photograph is rotated; `width`/`height` are the stored dimensions, so a
    // portrait shot on a phone would otherwise be laid out as a landscape and the grid would
    // reserve the wrong box for it. Orientation 5-8 are the 90-degree cases.
    const swap = (meta.orientation ?? 1) >= 5;
    const width = swap ? meta.height : meta.width;
    const height = swap ? meta.width : meta.height;
    if (!width || !height) {
      console.warn(`  ! ${file} — could not read dimensions, skipped`);
      continue;
    }

    const slug = slugFor(file, taken);
    const longEdge = Math.max(width, height);
    const widths = VARIANT_WIDTHS.filter((rung) => rung <= longEdge);
    // Never upscale — a 900px source has no 2400px version to give. But never emit nothing
    // either: a source smaller than the bottom rung is served at its own size.
    if (widths.length === 0) widths.push(longEdge);

    await mkdir(path.join(DIST, 'img'), { recursive: true });
    for (const rung of widths) {
      const out = path.join(DIST, 'img', `${slug}-${rung}.webp`);
      const info = await image
        .clone()
        .rotate() // applies the EXIF orientation, so the pixels match the aspect above
        .resize({ width: rung, height: rung, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: rung === widths[widths.length - 1] ? QUALITY_TOP : QUALITY })
        .toFile(out);
      written += 1;
      bytes += info.size;
    }

    images.push({
      id: slug,
      widths,
      aspect: width / height,
      sizeClass: classFromName(file),
      alt: altFromName(file),
    });
    process.stdout.write('.');
  }

  const manifest = { images, settings: await readSite() };

  // Inline it into the built shell, exactly where the placeholder is. This is what collapses
  // the load-JS -> fetch-manifest -> solve -> fetch-images waterfall, so the grid geometry
  // exists before the first image is requested and nothing shifts on screen.
  const shellPath = path.join(DIST, 'index.html');
  const shell = await readFile(shellPath, 'utf8').catch(() => {
    throw new Error('dist/index.html is missing — run `npm run build` first');
  });
  const placeholder = '<script type="application/json" id="manifest"></script>';
  if (!shell.includes(placeholder)) {
    throw new Error('dist/index.html has no manifest placeholder');
  }
  // `<` escaped so a photograph named `</script>` cannot break out of the JSON block.
  const json = JSON.stringify(manifest).replace(/</g, '\\u003c');
  await writeFile(
    shellPath,
    shell.replace(placeholder, `<script type="application/json" id="manifest">${json}</script>`),
  );

  console.log(
    `\n${images.length} photograph(s) · ${written} file(s) · ` +
      `${(bytes / 1024 / 1024).toFixed(1)} MB -> dist/img/`,
  );
  if (images.length === 0) {
    console.log('photos/ is empty — put some photographs in it and run this again.');
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});

/**
 * Proves the built gallery is a real, working site — served by a dumb static file server,
 * FROM A SUBDIRECTORY.
 *
 * The subdirectory is the whole point. GitHub Pages publishes a project repository at
 * `user.github.io/their-repo/`, not at a domain root, and an absolute `/assets/…` or
 * `/img/…` 404s there while working perfectly on your machine. That is the classic way a
 * Pages deployment ships broken, so this serves the site one level down and refuses to pass
 * unless every asset and every photograph still resolves.
 *
 * It also asserts the two properties the grid exists for: it never crops, and layout shift
 * is zero because the manifest was inlined before anything loaded.
 *
 * Prerequisites: `npm run gallery`.
 *
 *   npm run verify
 */

import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const CHROME =
  process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 8798;
const SUBPATH = 'a-project-page';

const failures = [];
function check(condition, message, detail = '') {
  if (condition) console.log(`  ✓ ${message}`);
  else {
    console.log(`  ✗ ${message}${detail ? ` — ${detail}` : ''}`);
    failures.push(message);
  }
}

async function main() {
  // Copy the build one level down, so the site is served exactly as a project page is.
  const root = await mkdtemp(path.join(tmpdir(), 'gallery-'));
  await cp(path.resolve('dist'), path.join(root, SUBPATH), { recursive: true });

  // python3 -m http.server: deliberately the dumbest thing that serves files. If it works
  // here it works on Pages, on S3, on a VPS, or from a USB stick.
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
    cwd: root,
    stdio: 'ignore',
  });

  let browser;
  try {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    browser = await chromium.launch({ executablePath: CHROME });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    const broken = [];
    page.on('requestfailed', (request) => broken.push(request.url()));
    page.on('response', (response) => {
      if (response.status() >= 400) broken.push(`${response.status()} ${response.url()}`);
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));

    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__cls += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });

    await page.goto(`http://127.0.0.1:${PORT}/${SUBPATH}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    // Scroll the whole page before counting. Images are lazy, so a first-paint count is
    // short by design — and scrolling is also where late-arriving images would shift the
    // layout, which is exactly the thing being measured.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(600);

    const stats = await page.evaluate(() => {
      const images = [...document.querySelectorAll('img')];
      const loaded = images.filter((image) => image.complete && image.naturalWidth > 0);
      const cropped = loaded.filter((image) => {
        const box = image.getBoundingClientRect();
        if (box.height === 0) return false;
        return Math.abs(box.width / box.height - image.naturalWidth / image.naturalHeight) > 0.02;
      });
      return {
        total: images.length,
        loaded: loaded.length,
        cropped: cropped.length,
        cls: window.__cls,
        scrollWidth: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
        // Every src must sit under the subpath. An absolute URL would still LOAD here (the
        // server has a root), so checking the status codes alone would miss the bug that
        // breaks Pages — the path itself has to be relative.
        absolute: images.filter((image) => !image.getAttribute('src')?.startsWith('img/')).length,
      };
    });

    console.log(`\nServed from /${SUBPATH}/, as plain files`);
    check(stats.total > 0, `the grid rendered (${stats.total} images)`);
    check(stats.loaded === stats.total, `every image loaded (${stats.loaded}/${stats.total})`);
    check(stats.absolute === 0, `image paths are relative (${stats.absolute} absolute)`);
    check(stats.cropped === 0, `nothing is cropped (${stats.cropped} off-aspect)`);
    check(stats.cls === 0, `CLS is 0.00000 with no server (${stats.cls.toFixed(5)})`);
    check(
      stats.scrollWidth <= stats.viewport,
      `no horizontal overflow (${stats.scrollWidth} ≤ ${stats.viewport})`,
    );
    check(broken.length === 0, 'no failed requests', broken.slice(0, 4).join(', '));
    check(errors.length === 0, 'no page errors', errors.slice(0, 2).join(' | '));
  } finally {
    await browser?.close();
    server.kill();
    await rm(root, { recursive: true, force: true });
  }

  console.log(
    failures.length === 0
      ? '\nIt works from a subdirectory, which is where Pages will put it.'
      : `\n${failures.length} check(s) FAILED.`,
  );
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

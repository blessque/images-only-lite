import { useMemo } from 'react';
import { readInlineManifest } from '@/lib/manifest';
import { IMAGE_BASE } from '@/lib/imageUrl';
import { Grid } from '@/grid/Grid';
import { Footer } from '@/components/Footer';
import '@/grid/grid.css';

/**
 * The whole application.
 *
 * There is no loading state and no fetch, because there is nothing to wait for: the build
 * writes the manifest into the HTML, so the grid can be solved on the first render, before
 * a single image byte is requested. That is what makes layout shift zero rather than small.
 */
export function App() {
  const manifest = useMemo(() => readInlineManifest(), []);

  if (!manifest) {
    // Only reachable in `npm run dev` before `npm run gallery` has ever been run, or if the
    // build wrote something malformed. Say which, rather than showing an empty black page.
    return (
      <p className="app-message">
        No gallery yet. Put photographs in <code>photos/</code> and run{' '}
        <code>npm run gallery</code>.
      </p>
    );
  }

  return (
    <>
      <Grid items={manifest.images} base={IMAGE_BASE} />
      <Footer settings={manifest.settings} />
    </>
  );
}

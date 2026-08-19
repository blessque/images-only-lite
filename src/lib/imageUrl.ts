import type { ImageItem } from './types';

/**
 * RELATIVE, with no leading slash — and that is load-bearing.
 *
 * A template repository is served from wherever the person who used it put it:
 * `user.github.io/photos/`, `user.github.io/portfolio/`, or a custom domain at the root.
 * An absolute `/img` works only in the last case, so a leading slash here would mean every
 * fork needed configuring before it worked. Relative resolves against the document, so it
 * is correct everywhere and needs nothing.
 */
export const IMAGE_BASE = 'img';

/** One generated variant: `img/01-sunrise-solo-1600.webp`. */
export function variantUrl(base: string, item: ImageItem, width: number): string {
  return `${base}/${item.id}-${width}.webp`;
}

/**
 * The real pixel width of a variant, which is NOT the ladder width for portraits.
 *
 * Widths are LONG-EDGE sizes, so a 9:16 image at 1600 is 900x1600 — its width is 900.
 * `srcset`'s `w` descriptor must be the file's actual width or the browser's variant
 * selection is wrong for every portrait in the gallery, silently and in the expensive
 * direction (it over-fetches).
 */
export function variantPixelWidth(width: number, aspect: number): number {
  return aspect >= 1 ? width : Math.max(1, Math.round(width * aspect));
}

/**
 * `suffix` is the retry cache-buster, and it belongs here rather than in a regex over the
 * finished string — string surgery in the component is a thing no unit test can reach.
 */
export function srcSetFor(base: string, item: ImageItem, suffix = ''): string | null {
  if (item.widths.length === 0) return null;
  return item.widths
    .map(
      (width) =>
        `${variantUrl(base, item, width)}${suffix} ` +
        `${variantPixelWidth(width, item.aspect)}w`,
    )
    .join(', ');
}

/** Fallback for browsers ignoring srcset — the middle variant, clamped to what exists. */
export function fallbackSrc(base: string, item: ImageItem): string {
  const width = item.widths[1] ?? item.widths[0];
  if (width === undefined) return '';
  return variantUrl(base, item, width);
}

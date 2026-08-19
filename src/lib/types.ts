/**
 * The manifest the build writes into the HTML, and the only contract between
 * `scripts/build-gallery.mjs` and the grid.
 */

/**
 * SOLO takes a whole row on its own, at any aspect ratio. WIDE and TIGHT share rows and
 * differ only in how much of one they ask for — `tight` packs more per row.
 *
 * These are width FRACTIONS, not sizes. Within a row every image shares a height, so their
 * widths are locked to their aspect ratios: a "big" portrait beside a "small" landscape
 * would come out narrower than the small one. `solo` is the honest way to make something
 * prominent, and it is named for what it actually does.
 */
export type SizeClass = 'solo' | 'wide' | 'tight';

export const SIZE_CLASSES: readonly SizeClass[] = ['solo', 'wide', 'tight'];

export interface ImageItem {
  /**
   * Unique identity AND the path stem of the generated variants, without the width or
   * extension: `01-sunrise-solo` becomes `img/01-sunrise-solo-1600.webp`.
   *
   * A slug of your filename rather than a hash, on purpose. You should recognise your own
   * photograph in the URL — this is a repository you are meant to read.
   */
  id: string;
  /** Widths actually generated, ascending. The build never upscales, so a small source stops early. */
  widths: number[];
  /**
   * w/h. Stored as a float rather than as width+height because it is the only thing layout
   * needs, and keeping both invites someone to recompute it inconsistently. It is also what
   * makes CLS zero: the grid solves from these before a single image byte is requested.
   */
  aspect: number;
  sizeClass: SizeClass;
  alt: string;
}

export interface Settings {
  name: string;
  contact: string;
}

export interface Manifest {
  images: ImageItem[];
  settings: Settings;
}

/** Long-edge widths the build generates. Every number the gallery is tuned by lives in a params file. */
export const VARIANT_WIDTHS = [400, 800, 1600, 2400] as const;

import { createContext, useContext, type ReactNode } from 'react';
import type { ImageItem, Settings } from './types';

/**
 * An empty seam, kept on purpose.
 *
 * This edition has no admin layer, so nothing ever provides this context and every hook
 * below returns nothing. It exists so `Grid.tsx` and `Tile.tsx` stay byte-identical to the
 * full edition they came from — those two files are the actual product, and a fix made to
 * one should be able to move to the other by copying the file rather than by re-reading it.
 *
 * The cost is about twenty lines that do nothing. The alternative was editing the two files
 * that most need to stay comparable, which is a worse trade.
 *
 * The full edition: https://github.com/blessque/images-only
 */
export interface AdminHooks {
  /** Rendered inside each tile when admin is active. Never, here. */
  renderTileOverlay?: (item: ImageItem, index: number) => ReactNode;
  /** Turns the footer's text into editable fields. Never, here. */
  editSettings?: (patch: Partial<Settings>) => void;
  /** Lets the grid surface admin-only advice, e.g. a final row that solved absurdly tall. */
  adminActive?: boolean;
}

export const AdminContext = createContext<AdminHooks>({});

export function useAdminHooks(): AdminHooks {
  return useContext(AdminContext);
}

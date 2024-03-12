/** in pixels */
const TILE_SIZE = 64;

export function convertToTiles(pixels: number): Tile {
  return Math.round(pixels / TILE_SIZE) as Tile;
}

export function convertToPixels(tiles: Tile): number {
  return (tiles * TILE_SIZE) as number;
}

/** @deprecated */
export const TILEX_PX = 64 as Px;
/** @deprecated */
export const TILEY_PX = 60 as Px;
export const SCREEN_TILE = 16 as TilesX;
/** @deprecated */
export const SCREENX_PX = (SCREEN_TILE * TILEX_PX) as Px;
/** @deprecated */
export const SCREENY_PX = (SCREEN_TILE * TILEY_PX) as Px;
/** @deprecated */

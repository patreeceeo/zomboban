/** in pixels */
const TILE_SIZE = 64;

export function convertToTiles(pixels: number): Tile {
  return (pixels / TILE_SIZE) as Tile;
}

export function convertToPixels(tiles: Tile): number {
  return (tiles * TILE_SIZE) as number;
}

/** @deprecated */
export const TILEX_PX = 64 as Px;
/** @deprecated */
export const TILEY_PX = 60 as Px;
/** @deprecated */
export const TILEX_PPS = TILEX_PX as unknown as Pps;
/** @deprecated */
export const TILEY_PPS = TILEY_PX as unknown as Pps;
export const SCREEN_TILE = 16 as TilesX;
/** @deprecated */
export const SCREENX_PX = (SCREEN_TILE * TILEX_PX) as Px;
/** @deprecated */
export const SCREENY_PX = (SCREEN_TILE * TILEY_PX) as Px;
/** @deprecated */
export function convertPixelsToTilesX(pixels: Px): TilesX {
  return (pixels / TILEX_PX) as TilesX;
}
/** @deprecated */
export function convertPixelsToTilesY(pixels: Px): TilesY {
  return (pixels / TILEY_PX) as TilesY;
}
/** @deprecated */
export function convertTilesXToPixels(tiles: TilesX): Px {
  return (tiles * TILEX_PX) as Px;
}
/** @deprecated */
export function convertTilesYToPixels(tiles: TilesY): Px {
  return (tiles * TILEY_PX) as Px;
}
/** @deprecated */
export const convertPpsToTxps = convertPixelsToTilesX as unknown as (
  pps: Pps
) => Txps;
/** @deprecated */
export const convertPpsToTyps = convertPixelsToTilesY as unknown as (
  pps: Pps
) => Typs;
/** @deprecated */
export const convertTxpsToPps = convertTilesXToPixels as unknown as (
  tps: Txps
) => Pps;
/** @deprecated */
export const convertTypsToPps = convertTilesYToPixels as unknown as (
  tps: Typs
) => Pps;

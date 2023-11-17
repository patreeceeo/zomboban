export const TILE_PX = 32 as Px;
export const TILE_PPS = TILE_PX as unknown as Pps;
export function convertPixelsToTiles(pixels: Px): Tiles {
  return (pixels / TILE_PX) as Tiles;
}
export function convertTilesToPixels(tiles: Tiles): Px {
  return (tiles * TILE_PX) as Px;
}
export const convertPpsToTps = convertPixelsToTiles as unknown as (
  pps: Pps,
) => Tps;
export const convertTpsToPps = convertTilesToPixels as unknown as (
  tps: Tps,
) => Pps;

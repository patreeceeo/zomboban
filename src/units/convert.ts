export const TILEX_PX = 64 as Px;
export const TILEY_PX = 60 as Px;
export const TILEX_PPS = TILEX_PX as unknown as Pps;
export const TILEY_PPS = TILEY_PX as unknown as Pps;
export const SCREEN_TILE = 16 as TilesX;
export const SCREENX_PX = (SCREEN_TILE * TILEX_PX) as Px;
export const SCREENY_PX = (SCREEN_TILE * TILEY_PX) as Px;
export function convertPixelsToTilesX(pixels: Px): TilesX {
  return (pixels / TILEX_PX) as TilesX;
}
export function convertPixelsToTilesY(pixels: Px): TilesY {
  return (pixels / TILEY_PX) as TilesY;
}
export function convertTilesXToPixels(tiles: TilesX): Px {
  return (tiles * TILEX_PX) as Px;
}
export function convertTilesYToPixels(tiles: TilesY): Px {
  return (tiles * TILEY_PX) as Px;
}
export const convertPpsToTxps = convertPixelsToTilesX as unknown as (
  pps: Pps,
) => Txps;
export const convertPpsToTyps = convertPixelsToTilesY as unknown as (
  pps: Pps,
) => Typs;
export const convertTxpsToPps = convertTilesXToPixels as unknown as (
  tps: Txps,
) => Pps;
export const convertTypsToPps = convertTilesYToPixels as unknown as (
  tps: Typs,
) => Pps;

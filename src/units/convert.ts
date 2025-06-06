import { Tiles, Px, TilesX } from "./types";

/** in pixels */
const TILE_SIZE = 64;

export function convertToTiles(pixels: number): Tiles {
  return Math.round(pixels / TILE_SIZE) as Tiles;
}
export function convertToTilesMax(pixels: number): Tiles {
  return Math.ceil(pixels / TILE_SIZE) as Tiles;
}
export function convertToTilesMin(pixels: number): Tiles {
  return Math.floor(pixels / TILE_SIZE) as Tiles;
}

export function convertToPixels(tiles: Tiles): number {
  return (tiles * TILE_SIZE) as number;
}

export function isTileAligned(pixels: number): boolean {
  return pixels % TILE_SIZE === 0;
}

export function convertPropertiesToTiles(
  object: any,
  keys = Object.keys(object)
) {
  for (const key of keys) {
    object[key] = convertToTiles(object[key]);
  }
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

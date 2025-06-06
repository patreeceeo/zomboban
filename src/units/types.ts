declare const OPAQUE_TYPE: unique symbol;

type Opaque<BaseType, Type> = BaseType & {
  readonly [OPAQUE_TYPE]: Type;
};

export type Tiles = Opaque<number, "Tile">;

/** @deprecated */
export type Px = Opaque<number, "Pixels">;
/** @deprecated */
export type TilesX = Opaque<number, "Tiles in X dimension (per second)">;
/** @deprecated */
export type TilesY = Opaque<number, "Tiles in Y dimension (per second)">;
/** @deprecated */
export type Pps = Opaque<number, "PixelsPerSecond">;
/** @deprecated */
export type Txps = TilesX;
/** @deprecated */
export type Typs = TilesY;

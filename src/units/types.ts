declare const OPAQUE_TYPE: unique symbol;

type Opaque<BaseType, Type> = BaseType & {
  readonly [OPAQUE_TYPE]: Type;
};

type Tiles = Opaque<number, "Tile">;

/** @deprecated */
type Px = Opaque<number, "Pixels">;
/** @deprecated */
type TilesX = Opaque<number, "Tiles in X dimension (per second)">;
/** @deprecated */
type TilesY = Opaque<number, "Tiles in Y dimension (per second)">;
/** @deprecated */
type Pps = Opaque<number, "PixelsPerSecond">;
/** @deprecated */
type Txps = TilesX;
/** @deprecated */
type Typs = TilesY;

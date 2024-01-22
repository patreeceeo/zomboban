declare const OPAQUE_TYPE: unique symbol;

type Opaque<BaseType, Type> = BaseType & {
  readonly [OPAQUE_TYPE]: Type;
};

type Px = Opaque<number, "Pixels">;
type TilesX = Opaque<number, "Tiles in X dimension (per second)">;
type TilesY = Opaque<number, "Tiles in Y dimension (per second)">;
type Pps = Opaque<number, "PixelsPerSecond">;
type Txps = TilesX;
type Typs = TilesY;

declare const OPAQUE_TYPE: unique symbol;

type Opaque<BaseType, Type> = BaseType & {
  readonly [OPAQUE_TYPE]: Type;
};

type Px = Opaque<number, "Pixels">;
type Tiles = Opaque<number, "Tiles">;
type Pps = Opaque<number, "PixelsPerSecond">;
type Tps = Opaque<number, "TilesPerSecond">;

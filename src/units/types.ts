declare const OPAQUE_TYPE: unique symbol;

type Opaque<BaseType, Type> = BaseType & {
  readonly [OPAQUE_TYPE]: Type;
};

type Px = Opaque<number, "Pixels">;
type TilesX = Opaque<number, "TilesX">;
type TilesY = Opaque<number, "TilesY">;
type Pps = Opaque<number, "PixelsPerSecond">;
type Txps = Opaque<number, "TilesXPerSecond">;
type Typs = Opaque<number, "TilesYPerSecond">;

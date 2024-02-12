export interface Vec2<T> {
  x: T;
  y: T;
}

const _reused: Vec2<any> = { x: 0, y: 0 };

const VEC2_ZERO = { x: 0, y: 0 } as Readonly<Vec2<any>>;

export function ZeroVec2<T>() {
  return VEC2_ZERO as Vec2<T>;
}

export function reuseVec2<T>(x: T, y: T) {
  _reused.x = x;
  _reused.y = y;
  return _reused as Vec2<T>;
}

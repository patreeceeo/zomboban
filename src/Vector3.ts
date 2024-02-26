import { Vector3 as Vector3Base } from "three";

export class Vector3<T extends number = number> extends Vector3Base {
  static ZERO = Object.freeze(new Vector3Base(0, 0, 0));
  declare x: T;
  declare y: T;
  declare z: T;
}

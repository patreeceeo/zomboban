import { Vector3 } from "../Three";

export interface Vector3WithSnapping extends Vector3 {
  fractional: Vector3;
}

export function applySnappingToVector3(vec: Vector3, unit: number) {
  const vecWithSnapping = vec as Vector3WithSnapping;
  vecWithSnapping.fractional = new Vector3();
  Object.defineProperty(vecWithSnapping, "x", {
    get() {
      return Math.round(vecWithSnapping.fractional.x / unit) * unit;
    },
    set(v) {
      vecWithSnapping.fractional.x = v;
    }
  });
  Object.defineProperty(vecWithSnapping, "y", {
    get() {
      return Math.round(vecWithSnapping.fractional.y / unit) * unit;
    },
    set(v) {
      vecWithSnapping.fractional.y = v;
    }
  });
  Object.defineProperty(vecWithSnapping, "z", {
    get() {
      return Math.round(vecWithSnapping.fractional.z / unit) * unit;
    },
    set(v) {
      vecWithSnapping.fractional.z = v;
    }
  });
  return vecWithSnapping;
}

export interface ReadonlyVector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

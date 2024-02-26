import { ObjectArrayComponent } from "../Component";
import { Vector3 } from "../Vector3";

interface SerializedVector3 {
  x: number;
  y: number;
  z: number;
}

export class PositionComponent extends ObjectArrayComponent<
  Vector3<Px>,
  SerializedVector3
> {
  constructor() {
    super(() => new Vector3());
  }

  equals(a: Vector3<Px>, b: Vector3<Px>): boolean {
    return a.equals(b);
  }

  copy(dest: Vector3<Px>, src: Vector3<Px>) {
    dest.copy(src);
  }

  deserialize(entityId: number, data: SerializedVector3): void {
    this.get(entityId).copy(data);
  }
}

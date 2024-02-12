import { ComponentBase } from "../Component";
import { reuseVec2, Vec2 } from "../Vec2";

export class PositionComponent extends ComponentBase<Vec2<Px>> {
  constructor(
    readonly xComponent: ComponentBase<Px>,
    readonly yComponent: ComponentBase<Px>,
  ) {
    super([]);
  }

  has(entityId: number) {
    return this.xComponent.has(entityId) && this.yComponent.has(entityId);
  }

  /** NOTE: the returned object will be modified by subsequent calls to this method */
  get(entityId: number) {
    return reuseVec2(
      this.xComponent.get(entityId),
      this.yComponent.get(entityId),
    );
  }

  is(entityId: number, value: Vec2<Px>): boolean {
    return (
      this.xComponent.is(entityId, value.x) &&
      this.yComponent.is(entityId, value.y)
    );
  }

  addSet(entityId: number, value: Vec2<Px>): void {
    this.xComponent.addSet(entityId, value.x);
    this.yComponent.addSet(entityId, value.y);
  }

  remove(entityId: number): void {
    this.xComponent.remove(entityId);
    this.yComponent.remove(entityId);
  }

  serialize(entityId: number): Vec2<Px> {
    return this.get(entityId);
  }

  deserialize(entityId: number, value: Vec2<Px>): void {
    this.addSet(entityId, value);
  }
}

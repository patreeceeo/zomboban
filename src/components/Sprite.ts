import { ObjectArrayComponent } from "../Component";
import { Sprite } from "three";

// TODO rename to SpriteComponent
export class SpriteComponent extends ObjectArrayComponent<Sprite, boolean> {
  constructor() {
    super(() => new Sprite());
  }
  copy(dest: Sprite, src: Sprite): void {
    dest.copy(src);
  }
  serialize(entityId: number): boolean {
    return this.has(entityId);
  }
  deserialize(entityId: number, value: boolean): void {
    if (value) {
      this.acquire(entityId);
    } else {
      this.remove(entityId);
    }
  }
}

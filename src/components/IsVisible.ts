import { PrimativeArrayComponent, TagComponent } from "../Component";
import { createAddSetFunction } from "./IsRenderDirty";

export class IsVisibleComponent extends PrimativeArrayComponent<boolean> {
  constructor(isRenderDirtyComponent: TagComponent) {
    super([]);
    this.addSet = createAddSetFunction(isRenderDirtyComponent)(
      this.has.bind(this),
      this.get.bind(this),
      super.addSet.bind(this),
    );
  }
  has = (_entityId: number) => {
    return true;
  };
  get(entityId: number): boolean {
    return super.get(entityId) ?? true;
  }
}

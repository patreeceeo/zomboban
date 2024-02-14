import { PrimativeArrayComponent, TagComponent } from "../Component";
import { createAddSetFunction } from "./IsRenderDirty";

export class TintComponent extends PrimativeArrayComponent<number> {
  constructor(isRenderDirtyComponent: TagComponent) {
    super([]);
    this.addSet = createAddSetFunction(isRenderDirtyComponent)(
      this.has.bind(this),
      this.get.bind(this),
      super.addSet.bind(this),
    );
  }
}

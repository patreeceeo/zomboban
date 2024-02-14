import { Container } from "pixi.js";
import { PrimativeArrayComponent, TagComponent } from "../Component";
import { createAddSetFunction } from "./IsRenderDirty";

export class DisplayContainerComponent extends PrimativeArrayComponent<Container> {
  constructor(isRenderDirtyComponent: TagComponent) {
    super([]);
    this.addSet = createAddSetFunction(isRenderDirtyComponent)(
      this.has.bind(this),
      this.get.bind(this),
      super.addSet.bind(this),
    );
  }
}

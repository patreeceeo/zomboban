import { Container } from "pixi.js";
import { PrimativeArrayComponent, TagComponent } from "../Component";
import { createAddSetFunction } from "./IsRenderDirty";

/** @deprecated */
export class DisplayContainerComponent extends PrimativeArrayComponent<Container> {
  constructor(isRenderDirtyComponent: TagComponent) {
    super([]);
    this.set = createAddSetFunction(isRenderDirtyComponent)(
      this.has.bind(this),
      this.get.bind(this),
      super.set.bind(this),
    );
  }
}

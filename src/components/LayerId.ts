import { PrimativeArrayComponent } from "../Component";

export class LayerIdComponent extends PrimativeArrayComponent<number> {
  constructor() {
    super([]);
  }
}

export const enum LayerId {
  Background,
  Object,
  UI,
}

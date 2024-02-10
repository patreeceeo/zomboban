import { PrimativeArrayComponent } from "../Component";

export const enum EntityFrameOperation {
  NONE,
  REMOVE,
  RESTORE,
}

export class EntityFrameOperationComponent extends PrimativeArrayComponent<EntityFrameOperation> {
  constructor() {
    super([]);
  }
}

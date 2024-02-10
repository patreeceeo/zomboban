import { PrimativeArrayComponent } from "../Component";

export class IsVisibleComponent extends PrimativeArrayComponent<boolean> {
  constructor() {
    super([]);
  }
  has = (_entityId: number) => {
    return true;
  };
  get(entityId: number): boolean {
    return super.get(entityId) ?? true;
  }
}

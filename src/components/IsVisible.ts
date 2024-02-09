import { PrimativeArrayComponent } from "../Component";
import { ComponentName } from ".";

export class IsVisibleComponent extends PrimativeArrayComponent<
  ComponentName.IsVisible,
  boolean
> {
  constructor() {
    super(ComponentName.IsVisible, []);
  }
  has = (_entityId: number) => {
    return true;
  };
  get(entityId: number): boolean {
    return super.get(entityId) ?? true;
  }
}

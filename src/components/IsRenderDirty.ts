import { ComponentBase, TagComponent } from "../Component";

/** @deprecated ? */
export class IsRenderDirtyComponent extends TagComponent {}

interface Context {
  superAddSet: ComponentBase<any>["set"];
  has: ComponentBase<any>["has"];
  get: ComponentBase<any>["get"];
  isRenderDirtyComponent: IsRenderDirtyComponent;
}

function addSet<T>(this: Context, entity: number, value: T) {
  if (!this.has(entity) || value !== this.get(entity)) {
    this.superAddSet(entity, value);
    this.isRenderDirtyComponent.set(entity);
  }
}
export function createAddSetFunction<T>(
  isRenderDirtyComponent: IsRenderDirtyComponent,
) {
  return (
    has: ComponentBase<T>["has"],
    get: ComponentBase<T>["get"],
    superAddSet: ComponentBase<T>["set"],
  ) => {
    const context: Context = {
      has,
      get,
      superAddSet,
      isRenderDirtyComponent,
    };
    return addSet.bind(context);
  };
}

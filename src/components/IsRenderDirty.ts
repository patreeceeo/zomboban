import { ComponentBase, TagComponent } from "../Component";
export class IsRenderDirtyComponent extends TagComponent {}

interface Context {
  superAddSet: ComponentBase<any>["addSet"];
  has: ComponentBase<any>["has"];
  get: ComponentBase<any>["get"];
  isRenderDirtyComponent: IsRenderDirtyComponent;
}

function addSet<T>(this: Context, entity: number, value: T) {
  if (!this.has(entity) || value !== this.get(entity)) {
    this.superAddSet(entity, value);
    this.isRenderDirtyComponent.addSet(entity);
  }
}
export function createAddSetFunction<T>(
  isRenderDirtyComponent: IsRenderDirtyComponent,
) {
  return (
    has: ComponentBase<T>["has"],
    get: ComponentBase<T>["get"],
    superAddSet: ComponentBase<T>["addSet"],
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

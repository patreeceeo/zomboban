import { PrimativeArrayComponent, TagComponent } from "../Component";
import { createAddSetFunction } from "./IsRenderDirty";

// TODO
// class ImageIdComponent extends ArrayComponentBase<
//   ComponentName.ImageId,
//   number,
//   string
// > {
//   #ImageComponent: PrimativeArrayComponent<ComponentName.Image, Image>;
//   constructor(
//     ImageComponent: PrimativeArrayComponent<ComponentName.Image, Image>,
//   ) {
//     super(ComponentName.ImageId, []);
//     this.#ImageComponent = ImageComponent;
//   }
//   set = (entityId: number, value: number) => {
//     invariant(this.#ImageComponent.has(value), `Image ${value} does not exist`);
//     this.set(entityId, value);
//   };
//   serialize = (entityId: number) => {
//     return this.#ImageComponent.get(entityId).src;
//   };
//   deserialize = (entityId: number, serializedValue: string) => {
//     const imageIds = this.#ImageComponent.ids;
//     // TODO load and await the image if it's not already loaded
//     this.set(entityId, imageId);
//   };
// }
export class ImageIdComponent extends PrimativeArrayComponent<number> {
  constructor(isRenderDirtyComponent: TagComponent) {
    super([]);
    this.addSet = createAddSetFunction(isRenderDirtyComponent)(
      this.has.bind(this),
      this.get.bind(this),
      super.addSet.bind(this),
    );
  }
}

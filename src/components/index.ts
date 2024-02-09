import { Container } from "pixi.js";
import { ArrayComponentBase, PrimativeArrayComponent } from "../Component";
import { invariant } from "../Error";
import { Animation } from "../components/Animation";
import { Image } from "../components/Image";
import { LayerId } from "../components/Layer";
import { LoadingState } from "../components/LoadingState";
import { BehaviorComponent } from "../components/Behavior";
import { EntityFrameOperation } from "../components/EntityFrameOperation";
import { IsVisibleComponent } from "../components/IsVisible";

// TODO use the component class itself as the unique identifier?
export enum ComponentName {
  Guid = "Guid",
  Animation = "Animation",
  Behavior = "Behavior",
  CameraFollow = "CameraFollow",
  DisplayContainer = "DisplayContainer",
  EntityFrameOperation = "EntityFrameOperation",
  Image = "Image",
  ImageId = "ImageId",
  /* true by default */
  IsVisible = "IsVisible",
  LayerId = "LayerId",
  LoadingState = "LoadingState",
  /** relative to the camera position */
  PositionX = "PositionX",
  /** relative to the camera position */
  PositionY = "PositionY",
  ShouldSave = "ShouldSave",
  Tint = "Tint",
  VelocityX = "VelocityX",
  VelocityY = "VelocityY",
  WorldId = "WorldId",
  Promise = "Promise",
}

//
// Component Definitions

// TODO move to a different file

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

//
// Component Dictionary
//
export class ComponentDictionary {
  #entries: Record<ComponentName, ArrayComponentBase<ComponentName, any, any>>;
  constructor() {
    this.#entries = {} as any;
    this.add(ComponentName.Guid);
    this.add(ComponentName.Animation);
    this.add(ComponentName.Behavior, new BehaviorComponent());
    this.add(ComponentName.CameraFollow);
    this.add(ComponentName.DisplayContainer);
    this.add(ComponentName.EntityFrameOperation);
    this.add(ComponentName.Image);
    // TODO assert that the image exists
    this.add(ComponentName.ImageId);
    this.add(ComponentName.IsVisible, new IsVisibleComponent());
    this.add(ComponentName.LayerId);
    this.add(ComponentName.LoadingState);
    this.add(ComponentName.PositionX);
    this.add(ComponentName.PositionY);
    this.add(ComponentName.VelocityX);
    this.add(ComponentName.VelocityY);
    this.add(ComponentName.ShouldSave);
    this.add(ComponentName.Tint);
    // TODO assert that the world exists?
    this.add(ComponentName.WorldId);
    this.add(ComponentName.Promise);
  }
  add(
    name: ComponentName,
    component: ArrayComponentBase<
      ComponentName,
      any,
      any
    > = new PrimativeArrayComponent(name, [] as any[]),
  ) {
    invariant(!(name in this.#entries), `Component ${name} already exists`);
    this.#entries[name] = component;
  }
  get(name: ComponentName) {
    return this.#entries[name];
  }
  [Symbol.iterator]() {
    return Object.values(this.#entries)[Symbol.iterator]();
  }

  get Guid() {
    return this.get(ComponentName.Guid) as PrimativeArrayComponent<
      ComponentName.Guid,
      number
    >;
  }

  get Animation() {
    return this.get(ComponentName.Animation) as PrimativeArrayComponent<
      ComponentName.Animation,
      Animation
    >;
  }

  get Behavior() {
    return this.get(ComponentName.Behavior) as BehaviorComponent;
  }

  get CameraFollow() {
    return this.get(ComponentName.CameraFollow) as PrimativeArrayComponent<
      ComponentName.CameraFollow,
      number
    >;
  }

  get DisplayContainer() {
    return this.get(ComponentName.DisplayContainer) as PrimativeArrayComponent<
      ComponentName.DisplayContainer,
      Container
    >;
  }

  get EntityFrameOperation() {
    return this.get(
      ComponentName.EntityFrameOperation,
    ) as PrimativeArrayComponent<
      ComponentName.EntityFrameOperation,
      EntityFrameOperation
    >;
  }

  get Image() {
    return this.get(ComponentName.Image) as PrimativeArrayComponent<
      ComponentName.Image,
      Image
    >;
  }

  get ImageId() {
    return this.get(ComponentName.ImageId) as PrimativeArrayComponent<
      ComponentName.ImageId,
      number
    >;
  }

  get LayerId() {
    return this.get(ComponentName.LayerId) as PrimativeArrayComponent<
      ComponentName.LayerId,
      LayerId
    >;
  }

  get LoadingState() {
    return this.get(ComponentName.LoadingState) as PrimativeArrayComponent<
      ComponentName.LoadingState,
      LoadingState
    >;
  }

  get PositionX() {
    return this.get(ComponentName.PositionX) as PrimativeArrayComponent<
      ComponentName.PositionX,
      number
    >;
  }

  get PositionY() {
    return this.get(ComponentName.PositionY) as PrimativeArrayComponent<
      ComponentName.PositionY,
      number
    >;
  }

  get VelocityX() {
    return this.get(ComponentName.VelocityX) as PrimativeArrayComponent<
      ComponentName.VelocityX,
      number
    >;
  }

  get VelocityY() {
    return this.get(ComponentName.VelocityY) as PrimativeArrayComponent<
      ComponentName.VelocityY,
      number
    >;
  }

  get Tint() {
    return this.get(ComponentName.Tint) as PrimativeArrayComponent<
      ComponentName.Tint,
      number
    >;
  }

  get ShouldSave() {
    return this.get(ComponentName.ShouldSave) as PrimativeArrayComponent<
      ComponentName.ShouldSave,
      boolean
    >;
  }

  get IsVisible() {
    return this.get(ComponentName.IsVisible) as IsVisibleComponent;
  }

  get WorldId() {
    return this.get(ComponentName.WorldId) as PrimativeArrayComponent<
      ComponentName.WorldId,
      number
    >;
  }

  get Promise() {
    return this.get(ComponentName.Promise) as PrimativeArrayComponent<
      ComponentName.Promise,
      Promise<any>
    >;
  }
}

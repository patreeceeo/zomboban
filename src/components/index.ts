import { ComponentBase, ComponentConstructor } from "../Component";
import { AnimationComponent } from "./Animation";
import { ImageComponent } from "./Image";
import { LayerIdComponent } from "./LayerId";
import { LoadingStateComponent } from "./LoadingState";
import { BehaviorComponent } from "./Behavior";
import { EntityFrameOperationComponent } from "./EntityFrameOperation";
import { IsVisibleComponent } from "./IsVisible";
import { GuidComponent } from "./Guid";
import { PromiseComponent } from "./Promise";
import { DisplayContainerComponent } from "./DisplayContainer";
import { ImageIdComponent } from "./ImageId";
import { PositionXComponent } from "./PositionX";
import { PositionYComponent } from "./PositionY";
import { ShouldSaveComponent } from "./ShouldSave";
import { TintComponent } from "./Tint";
import { VelocityXComponent } from "./VelocityX";
import { VelocityYComponent } from "./VelocityY";
import { WorldIdComponent } from "./WorldId";
import { CameraFollowComponent } from "./CameraFollow";

//
// Component Dictionary
//
export class ComponentDictionary {
  #entries: Record<string, ComponentBase<any, any>>;
  constructor(
    onAdd = (_entityId: number, _value: any) => {},
    onRemove = (_entityId: number) => {},
  ) {
    this.#entries = {
      [GuidComponent.name]: new GuidComponent(),
      [AnimationComponent.name]: new AnimationComponent(),
      [BehaviorComponent.name]: new BehaviorComponent(),
      [CameraFollowComponent.name]: new CameraFollowComponent(),
      [DisplayContainerComponent.name]: new DisplayContainerComponent(),
      [EntityFrameOperationComponent.name]: new EntityFrameOperationComponent(),
      [ImageComponent.name]: new ImageComponent(),
      [ImageIdComponent.name]: new ImageIdComponent(),
      [IsVisibleComponent.name]: new IsVisibleComponent(),
      [LayerIdComponent.name]: new LayerIdComponent(),
      [LoadingStateComponent.name]: new LoadingStateComponent(),
      [PositionXComponent.name]: new PositionXComponent(),
      [PositionYComponent.name]: new PositionYComponent(),
      [ShouldSaveComponent.name]: new ShouldSaveComponent(),
      [TintComponent.name]: new TintComponent(),
      [VelocityXComponent.name]: new VelocityXComponent(),
      [VelocityYComponent.name]: new VelocityYComponent(),
      [WorldIdComponent.name]: new WorldIdComponent(),
      [PromiseComponent.name]: new PromiseComponent(),
    };

    for (const key in this.#entries) {
      this.#entries[key].onAddSet = onAdd;
      this.#entries[key].onRemove = onRemove;
    }
  }
  get(klass: ComponentConstructor<any, any>) {
    return this.#entries[klass.name];
  }
  [Symbol.iterator]() {
    return Object.values(this.#entries)[Symbol.iterator]();
  }

  get Guid() {
    return this.get(GuidComponent) as GuidComponent;
  }

  get Animation() {
    return this.get(AnimationComponent) as AnimationComponent;
  }

  get Behavior() {
    return this.get(BehaviorComponent) as BehaviorComponent;
  }

  get CameraFollow() {
    return this.get(CameraFollowComponent) as CameraFollowComponent;
  }

  get DisplayContainer() {
    return this.get(DisplayContainerComponent) as DisplayContainerComponent;
  }

  get EntityFrameOperation() {
    return this.get(
      EntityFrameOperationComponent,
    ) as EntityFrameOperationComponent;
  }

  get Image() {
    return this.get(ImageComponent) as ImageComponent;
  }

  get ImageId() {
    return this.get(ImageIdComponent) as ImageIdComponent;
  }

  get LayerId() {
    return this.get(LayerIdComponent) as LayerIdComponent;
  }

  get LoadingState() {
    return this.get(LoadingStateComponent) as LoadingStateComponent;
  }

  get PositionX() {
    return this.get(PositionXComponent) as PositionXComponent;
  }

  get PositionY() {
    return this.get(PositionYComponent) as PositionYComponent;
  }

  get VelocityX() {
    return this.get(VelocityXComponent) as VelocityXComponent;
  }

  get VelocityY() {
    return this.get(VelocityYComponent) as VelocityYComponent;
  }

  get Tint() {
    return this.get(TintComponent) as TintComponent;
  }

  get ShouldSave() {
    return this.get(ShouldSaveComponent) as ShouldSaveComponent;
  }

  get IsVisible() {
    return this.get(IsVisibleComponent) as IsVisibleComponent;
  }

  get WorldId() {
    return this.get(WorldIdComponent) as WorldIdComponent;
  }

  get Promise() {
    return this.get(PromiseComponent) as PromiseComponent;
  }
}

import { Sprite, Vector3 } from "three";
import { IEntity } from "../EntityManager";
import { defineComponent } from "../Component";

export type { ComponentBase, ComponentConstructor } from "../Component";
export { AnimationComponent } from "./Animation";
export { LayerIdComponent } from "./LayerId";
export { LoadingStateComponent } from "./LoadingState";
export { BehaviorComponent } from "./Behavior";
export { EntityFrameOperationComponent } from "./EntityFrameOperation";
export { IsVisibleComponent } from "./IsVisible";
export { GuidComponent } from "./Guid";
export { PromiseComponent } from "./Promise";
export { TextureComponent } from "./Texture";
export { TextureIdComponent } from "./TextureId";
export { PositionXComponent } from "./PositionX";
export { PositionYComponent } from "./PositionY";
export { ShouldSaveComponent } from "./ShouldSave";
export { TintComponent } from "./Tint";
export { VelocityXComponent } from "./VelocityX";
export { VelocityYComponent } from "./VelocityY";
export { WorldIdComponent } from "./WorldId";
export { CameraFollowComponent } from "./CameraFollow";
export { IsAddedComponent } from "./IsAddedComponent";
export { IsRemovedComponent } from "./IsRemovedComponent";
export { PositionComponent } from "./Position";
export { IsRenderDirtyComponent } from "./IsRenderDirty";
export { SpriteComponent } from "./Sprite";

export interface IHasTexture {
  textureId: string;
}

export interface IMaybeVisible {
  visible: boolean;
}

export interface IHasSprite {
  readonly sprite: Sprite;
}

export interface IPositionable {
  readonly position: Vector3;
}

export interface IMovable {
  readonly velocity: Vector3;
}

export interface ISpawnable {
  spawned: boolean;
}

export interface IActor {
  behaviorId: string;
}

export interface ISerializable<Data extends IEntity> {
  serialize(): Data;
  deserialize(data: Data): void;
}

export const SpriteComponent2 = defineComponent(
  class SpriteComponent2 {
    sprite = new Sprite();
    readonly position = this.sprite.position;
    get visible() {
      return this.sprite.visible;
    }
    set visible(value: boolean) {
      this.sprite.visible = value;
    }
    textureId = "/texture/null";
    static deserialize<E extends SpriteComponent2>(
      entity: E,
      data: { x: number; y: number; z: number },
    ) {
      entity.position.set(data.x, data.y, data.z);
    }
  },
);

import { Sprite, Vector3 } from "three";
import { IComponentDefinition, defineComponent } from "../Component";

export type { ComponentBase, ComponentConstructor } from "../Component";
export { AnimationComponent } from "./Animation";
export { LayerIdComponent } from "./LayerId";
export { LoadingStateComponent } from "./LoadingState";
export { BehaviorComponent } from "./Behavior";
export { EntityFrameOperationComponent } from "./EntityFrameOperation";
export { IsVisibleComponent } from "./IsVisible";
export { GuidComponent } from "./Guid";
export { PromiseComponent } from "./Promise";
export { TextureComponent as TextureComponentOld } from "./Texture";
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

interface ITextureComponent {
  textureId: string;
}

export const TextureComponent: IComponentDefinition<
  ITextureComponent,
  new () => ITextureComponent
> = defineComponent(
  class TextureComponent {
    textureId = "/texture/null";
    static deserialize<E extends TextureComponent>(
      entity: E,
      data: { textureId: string }
    ) {
      entity.textureId = data.textureId!;
    }
    // TODO use serialize target
    static serialize<E extends TextureComponent>(entity: E) {
      return {
        textureId: entity.textureId
      };
    }
  }
);

interface ISpriteComponent {
  sprite: Sprite;
  position: Vector3;
  visible: boolean;
}

export const SpriteComponent2: IComponentDefinition<
  ISpriteComponent,
  new () => ISpriteComponent
> = defineComponent(
  class SpriteComponent2 {
    sprite = new Sprite();
    readonly position = this.sprite.position;
    get visible() {
      return this.sprite.visible;
    }
    set visible(value: boolean) {
      this.sprite.visible = value;
    }
    static deserialize<E extends SpriteComponent2>(
      entity: E,
      data: Partial<{
        position: { x: number; y: number; z: number };
        visible: boolean;
      }>
    ) {
      if ("position" in data) {
        const { position } = data;
        entity.position.copy(position!);
      }
      if ("visible" in data) {
        entity.visible = data.visible!;
      }
    }
    // TODO use serialize target
    static serialize<E extends SpriteComponent2>(entity: E) {
      return {
        position: {
          x: entity.position.x,
          y: entity.position.y,
          z: entity.position.z
        },
        visible: entity.visible
      };
    }
  }
);

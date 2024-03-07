import { AnimationClip, Sprite, Vector3 } from "three";
import { IComponentDefinition, defineComponent } from "../Component";
import { KeyCombo, createInputQueue } from "../Input";

export type { ComponentBase, ComponentConstructor } from "../Component";
export { LayerIdComponent } from "./LayerId";
export { LoadingStateComponentOld } from "./LoadingState";
export { BehaviorComponent } from "./Behavior";
export { EntityFrameOperationComponent } from "./EntityFrameOperation";
export { IsVisibleComponent } from "./IsVisible";
export { GuidComponent } from "./Guid";
export { PromiseComponent } from "./Promise";
export { TextureComponent as TextureComponentOld } from "./Texture";
export { TextureIdComponentOld } from "./TextureId";
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

interface IKeyframeTrack<Value> {
  name: string;
  type: "string";
  times: Float32Array;
  values: Value[];
}

interface IAnimationClip<TrackValue> {
  name: string;
  tracks: IKeyframeTrack<TrackValue>[];
  /**
   * @default -1
   */
  duration: number;
}

interface ISpriteComponent {
  sprite: Sprite;
  animations: IAnimationClip<string>[];
  playingAnimationIndex: number;
  position: Vector3;
  visible: boolean;
  behaviorId: string;
}

export const SpriteComponent2: IComponentDefinition<
  Partial<ISpriteComponent>,
  new () => ISpriteComponent
> = defineComponent(
  class SpriteComponent2 {
    sprite = new Sprite();
    readonly position = this.sprite.position;
    readonly animations = [] as IAnimationClip<string>[];
    behaviorId = "behavior/null";
    playingAnimationIndex = 0;
    get visible() {
      return this.sprite.visible;
    }
    set visible(value: boolean) {
      this.sprite.visible = value;
    }
    static deserialize<E extends SpriteComponent2>(
      entity: E,
      data: Partial<ISpriteComponent>
    ) {
      if ("position" in data) {
        entity.position.copy(data.position!);
      }
      if ("visible" in data) {
        entity.visible = data.visible!;
      }
      if ("playingAnimationIndex" in data) {
        entity.playingAnimationIndex = data.playingAnimationIndex!;
      }
      if ("animations" in data) {
        for (const animJson of data.animations!) {
          entity.animations.push(
            AnimationClip.parse(animJson) as unknown as IAnimationClip<string>
          );
        }
      }
      if ("behaviorId" in data) {
        entity.behaviorId = data.behaviorId!;
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
        visible: entity.visible,
        animations: entity.animations.map((anim) =>
          AnimationClip.toJSON(anim as unknown as AnimationClip)
        ),
        playingAnimationIndex: entity.playingAnimationIndex,
        behaviorId: entity.behaviorId
      };
    }
  }
);

interface IInputQueueComponent {
  inputs: KeyCombo[];
}

export const InputQueueComponent: IComponentDefinition<
  {},
  new () => IInputQueueComponent
> = defineComponent(
  class InputQueueComponent {
    inputs = createInputQueue();
  }
);

import { AnimationClip, Sprite, Vector3 } from "three";
import { IComponentDefinition, defineComponent } from "../Component";
import { WithGetterSetter } from "../Mixins";
import { Action } from "../systems/ActionSystem";

export const IsActiveTag: IComponentDefinition = defineComponent();

export const IsGameEntityTag: IComponentDefinition = defineComponent();

export const InputReceiverTag: IComponentDefinition = defineComponent();

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

class Animation {
  readonly clips = [] as IAnimationClip<string>[];
  playing = false;
  clipIndex = 0;
}

interface ISpriteComponent {
  sprite: Sprite;
  animation: Animation;
  position: Vector3;
  visible: boolean;
}

export const SpriteComponent2: IComponentDefinition<
  Partial<ISpriteComponent>,
  new () => ISpriteComponent
> = defineComponent(
  WithGetterSetter(
    "visible",
    (c) => c.sprite.visible,
    (c, v) => (c.sprite.visible = v),
    class SpriteComponent2 {
      sprite = new Sprite();
      readonly position = this.sprite.position;
      readonly animation = new Animation();
      playingAnimationIndex = 0;
      declare visible: boolean;
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
        if ("animation" in data) {
          const animation = data.animation!;
          for (const animJson of animation!.clips!) {
            entity.animation.clips.push(
              AnimationClip.parse(animJson) as unknown as IAnimationClip<string>
            );
          }
          entity.animation.playing = animation.playing!;
          entity.animation.clipIndex = animation.clipIndex!;
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
          animation: {
            clips: entity.animation.clips.map((anim) =>
              AnimationClip.toJSON(anim as unknown as AnimationClip)
            ),
            playing: entity.animation.playing,
            clipIndex: entity.animation.clipIndex
          },
          playingAnimationIndex: entity.playingAnimationIndex
        };
      }
    }
  )
);

interface IBehaviorComponent {
  behaviorId: string;
  actions: Set<Action<this, any>>;
}

export const BehaviorComponent: IComponentDefinition<
  { behaviorId: string },
  new () => IBehaviorComponent
> = defineComponent(
  class BehaviorComponent {
    behaviorId = "behavior/null";
    actions = new Set() as any;
    static deserialize<E extends BehaviorComponent>(
      entity: E,
      data: { behaviorId: string }
    ) {
      entity.behaviorId = data.behaviorId!;
    }
    static serialize<E extends BehaviorComponent>(entity: E) {
      return {
        behaviorId: entity.behaviorId
      };
    }
  }
);

import { Sprite, Vector3 } from "three";
import { IComponentDefinition, defineComponent } from "../Component";
import { WithGetterSetter } from "../Mixins";
import { Action } from "../systems/ActionSystem";
import { Animation, AnimationClip } from "../Animation";
import { ObservableObject, ObservableObjectOptions } from "../Observable";

const ooOptions = new ObservableObjectOptions();
ooOptions.recursive = true;
ooOptions.testValue = (value: any) =>
  !(value instanceof Sprite) && !(value instanceof Set);

export function createObservableEntity() {
  return new ObservableObject({}, ooOptions);
}

interface IIsActiveTag {
  isActive: boolean;
}
export const IsActiveTag: IComponentDefinition = defineComponent(
  class {
    static deserialize<E extends IIsActiveTag>(_entity: E, _data: any) {}
    static canDeserialize(data: any) {
      return typeof data === "object" && "isActive" in data;
    }
    static serialize<E extends IIsActiveTag>(entity: E, target: any) {
      target.isActive = IsActiveTag.has(entity);
      return target;
    }
  }
);

interface IIsGameEntityTag {
  isGameEntity: boolean;
}
export const IsGameEntityTag: IComponentDefinition = defineComponent(
  class {
    static deserialize<E extends IIsGameEntityTag>(_entity: E, _data: any) {}
    static canDeserialize(data: any) {
      return typeof data === "object" && "isGameEntity" in data;
    }
    static serialize<E extends IIsGameEntityTag>(entity: E, target: any) {
      target.isGameEntity = IsGameEntityTag.has(entity);
      return target;
    }
  }
);

interface IInputReceiverTag {
  isInputReceiver: boolean;
}
export const InputReceiverTag: IComponentDefinition = defineComponent(
  class {
    static deserialize<E extends IInputReceiverTag>(_entity: E, _data: any) {}
    static canDeserialize(data: any) {
      return typeof data === "object" && "isInputReceiver" in data;
    }
    static serialize<E extends IInputReceiverTag>(entity: E, target: any) {
      target.isInputReceiver = InputReceiverTag.has(entity);
      return target;
    }
  }
);

interface IAddedTag {
  isAdded: boolean;
}
export const AddedTag: IComponentDefinition = defineComponent(
  class {
    static deserialize<E extends IAddedTag>(_entity: E, _data: any) {}
    static canDeserialize(data: any) {
      return typeof data === "object" && "isAdded" in data;
    }
    static serialize<E extends IAddedTag>(entity: E, target: any) {
      target.isAdded = AddedTag.has(entity);
      return target;
    }
  }
);

export const PendingActionTag: IComponentDefinition = defineComponent();

interface IIdComponent {
  id: number;
}

let entityId = 0;
export const IdComponent: IComponentDefinition<
  { id: number },
  new () => IIdComponent
> = defineComponent(
  class IdComponent {
    id = ++entityId;
    static deserialize<E extends IdComponent>(entity: E, data: { id: number }) {
      entity.id = data.id!;
    }
    static canDeserialize(data: any) {
      return typeof data === "object" && "id" in data;
    }
    static serialize<E extends IdComponent>(entity: E, target: any) {
      target.id = entity.id;
      return target;
    }
  }
);

interface IServerIdComponent {
  serverId: number;
}

let serverId = 0;
export const ServerIdComponent: IComponentDefinition<
  IServerIdComponent,
  new () => IServerIdComponent
> = defineComponent(
  class ServerIdComponent {
    serverId = ++serverId;
    static deserialize<E extends IServerIdComponent>(
      entity: E,
      data: IServerIdComponent
    ) {
      entity.serverId = data.serverId!;
    }
    static canDeserialize(data: any) {
      return typeof data === "object" && "serverId" in data;
    }
    static serialize<E extends IServerIdComponent>(entity: E, target: any) {
      target.serverId = entity.serverId;
      return target;
    }
  }
);

interface NameComponent {
  name: string;
}
export const NameComponent: IComponentDefinition<
  { name: string },
  new () => NameComponent
> = defineComponent(
  class NameComponent {
    name = "Un-named";
    static deserialize<E extends NameComponent>(
      entity: E,
      data: { name: string }
    ) {
      entity.name = data.name!;
    }
    static canDeserialize(data: any) {
      return typeof data === "object" && "name" in data;
    }
    static serialize<E extends NameComponent>(entity: E, target: any) {
      target.name = entity.name;
      return target;
    }
  }
);

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
          entity.animation.clips.length = 0;
          for (const animJson of animation!.clips!) {
            entity.animation.clips.push(AnimationClip.parse(animJson));
          }
          entity.animation.playing = animation.playing!;
          entity.animation.clipIndex = animation.clipIndex!;
        }
      }
      static canDeserialize(data: any) {
        return (
          typeof data === "object" &&
          ("position" in data || "visible" in data || "animation" in data)
        );
      }
      static serialize<E extends SpriteComponent2>(entity: E, target: any) {
        const typedTarget = target as ISpriteComponent;
        typedTarget.position = entity.position;
        typedTarget.visible = entity.visible;
        target.animation = {
          clips: entity.animation.clips.map((anim) =>
            AnimationClip.toJSON(anim)
          ),
          playing: entity.animation.playing,
          clipIndex: entity.animation.clipIndex
        };
        return target;
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
    static canDeserialize(data: any) {
      return typeof data === "object" && "behaviorId" in data;
    }
    static serialize<E extends BehaviorComponent>(entity: E, target: any) {
      target.behaviorId = entity.behaviorId;
      return target;
    }
  }
);

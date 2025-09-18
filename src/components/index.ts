import { Object3D, Vector3 } from "three";
import {
  EntityWithComponents,
  IComponentDefinition,
  defineComponent
} from "../Component";
import { Animation, AnimationClipJson, IAnimation, IAnimationJson } from "../Animation";
import { HeadingDirectionValue } from "../HeadingDirection";
import { IActor, IMessageConstructor } from "../Message";
import { Action } from "../Action";
import { InstanceMap } from "../collections";
import { BehaviorEnum } from "../behaviors";
import { Sprite } from "../Sprite";
import { Model3D } from "../systems/ModelSystem";
import {Entity} from "../Entity";

interface IIsActiveTag {
  isActive: boolean;
}
export const IsActiveTag: IComponentDefinition = defineComponent(
  class {
    static humanName = "IsActiveTag";
    static deserialize<E extends IIsActiveTag>(_entity: E, _data: any) {}
    static canDeserialize(data: any) {
      return typeof data === "object" && "isActive" in data;
    }
    static serialize(entity: Entity, target: any) {
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
    static humanName = "IsGameEntityTag";
    static deserialize<E extends IIsGameEntityTag>(_entity: E, _data: any) {}
    static canDeserialize(data: any) {
      return typeof data === "object" && "isGameEntity" in data;
    }
    static serialize(entity: Entity, target: any) {
      target.isGameEntity = IsGameEntityTag.has(entity);
      return target;
    }
  }
);

interface IInSceneTag {
  isInScene: boolean;
}
export const InSceneTag: IComponentDefinition = defineComponent(
  class {
    static humanName = "InSceneTag";
    static deserialize<E extends IInSceneTag>(_entity: E, _data: any) {}
    static canDeserialize(data: any) {
      return typeof data === "object" && "isInScene" in data;
    }
    static serialize(entity: Entity, target: IInSceneTag) {
      target.isInScene = InSceneTag.has(entity);
      return target;
    }
  }
);

export const CursorTag: IComponentDefinition = defineComponent(
  class {
    static humanName = "CursorTag";
  }
);

export const CanDeleteTag: IComponentDefinition = defineComponent(
  class {
    static humanName = "CanDeleteTag";
  }
);

/** Indicate a button or other pressable thing is pressed */
export const PressedTag: IComponentDefinition = defineComponent(
  class {
    static humanName = "PressedTag";
  }
);

interface IPlatformTag {
  isPlatform: boolean;
}
export const PlatformTag: IComponentDefinition = defineComponent(
  class {
    static humanName = "PlatformTag";
    static deserialize<E extends IPlatformTag>(_entity: E, _data: any) {}
    static canDeserialize(data: any) {
      return typeof data === "object" && "isPlatform" in data;
    }
    static serialize(entity: Entity, target: any) {
      target.isPlatform = PlatformTag.has(entity);
      return target;
    }
  }
);

interface IToggleableComponent {
  toggleState: boolean;
}

export const ToggleableComponent: IComponentDefinition<
  IToggleableComponent,
  new () => IToggleableComponent
> = defineComponent(
  class {
    toggleState = true;

    static humanName = "ToggleableComponent";

    static deserialize<E extends IToggleableComponent>(entity: E, data: E) {
      entity.toggleState = data.toggleState;
    }

    static canDeserialize(data: any): data is IToggleableComponent {
      return typeof data === "object" && "toggleState" in data;
    }

    static serialize<E extends IToggleableComponent>(entity: E, target: any) {
      target.toggleState = entity.toggleState;
      return target;
    }
  }
);

interface IServerIdComponent {
  serverId: number;
}

export const ServerIdComponent: IComponentDefinition<
  IServerIdComponent,
  new () => IServerIdComponent
> = defineComponent(
  class ServerIdComponent_ {
    serverId = -1;

    static deserialize<E extends IServerIdComponent>(
      entity: E,
      { serverId }: IServerIdComponent
    ) {
      entity.serverId = serverId!;
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

interface IBehaviorComponent extends IActor {
  actions: InstanceMap<
    IConstructor<Action<EntityWithComponents<typeof BehaviorComponent>, any>>
  >;
}

class MessageInstanceMap extends InstanceMap<IMessageConstructor<any>> {}

export const BehaviorComponent: IComponentDefinition<
  { behaviorId: BehaviorEnum },
  new () => IBehaviorComponent
> = defineComponent(
  class BehaviorComponent implements IBehaviorComponent {
    behaviorId = BehaviorEnum.Wall;
    actions = new InstanceMap() as any;
    inbox = new MessageInstanceMap();
    outbox = new MessageInstanceMap();
    static deserialize<E extends BehaviorComponent>(
      entity: E,
      data: { behaviorId: BehaviorEnum }
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


interface ITransformComponent {
  transform: Object3D;
}

interface ITransformJson {
  position: ITriad;
  rotation: ITriad;
  scale: ITriad;
  visible: boolean;
}

interface ITransformComponentJson {
  transform: ITransformJson;
}

type ITransformJsonPartial = Partial<ITransformJson>;

interface ITransformComponentJsonPartial {
  transform?: ITransformJsonPartial;
}

interface ITriad {
  x: number;
  y: number;
  z: number;
}

export const TransformComponent: IComponentDefinition<
  ITransformComponentJson,
  new () => ITransformComponent
> = defineComponent(
  class TransformComponent {
    transform = new Object3D();

    static deserializeTriad(triad: ITriad, source: ITriad) {
      triad.x = source.x;
      triad.y = source.y;
      triad.z = source.z;
    }
    static deserialize<E extends ITransformComponent>(
      entity: E,
      data: ITransformComponentJsonPartial
    ) {
      const { transform: transformJson } = data;

      if (!transformJson) return;

      const { transform } = entity;
      const { position, rotation, scale } = transform;
      const positionSource = transformJson.position || position;
      const rotationSource = transformJson.rotation || rotation;
      const scaleSource = transformJson.scale || scale;
      const visibleSource = transformJson.visible || transform.visible;

      this.deserializeTriad(position, positionSource);
      this.deserializeTriad(rotation, rotationSource);
      this.deserializeTriad(scale, scaleSource);
      transform.visible = visibleSource;
    }
    static canDeserialize(data: any) {
      return typeof data === "object" && "transform" in data;
    }
    static serializeTriad(
      triad: ITriad,
      target = { x: 0, y: 0, z: 0 } as ITriad
    ) {
      target.x = triad.x;
      target.y = triad.y;
      target.z = triad.z;
      return target;
    }
    static serialize<E extends ITransformComponent>(
      entity: E,
      target: ITransformComponentJson
    ) {
      const { transform } = entity;
      const { position, rotation, scale, visible } = transform;
      target.transform = {
        position: this.serializeTriad(position),
        rotation: this.serializeTriad(rotation),
        scale: this.serializeTriad(scale),
        visible
      };

      return target;
    }
  }
);

interface ISpriteComponent {
  sprite: Sprite;
}

const nullSprite = new Sprite(new Object3D());
export const SpriteComponent: IComponentDefinition<
  ISpriteComponent,
  new () => ISpriteComponent
> = defineComponent(
  class SpriteComponent {
    sprite = nullSprite;
  }
);

interface IAnimationComponent {
  animation: IAnimation;
}

interface IAnimationComponentJson {
  animation: IAnimationJson;
}

export const AnimationComponent: IComponentDefinition<
  IAnimationComponentJson,
  new () => IAnimationComponent
> = defineComponent(
  class SpriteAnimationComponent {
    animation = new Animation();
    static deserialize<E extends IAnimationComponent>(
      entity: E,
      data: IAnimationComponentJson
    ) {
      entity.animation.clips.length = 0;
      for (const json of data.animation.clips) {
        const clip = AnimationClipJson.parse(json)
        entity.animation.clips.push(clip);
      }
      entity.animation.playing = data.animation.playing;
      entity.animation.clipIndex = data.animation.clipIndex;
    }
    static canDeserialize(data: any) {
      return typeof data === "object" && "animation" in data;
    }
    static serialize<E extends IAnimationComponent>(
      entity: E,
      target: IAnimationComponentJson
    ) {
      target.animation = {
        clips: entity.animation.clips.map((clip) => AnimationClipJson.fromClip(clip)),
        playing: entity.animation.playing,
        clipIndex: entity.animation.clipIndex
      };
      return target;
    }
  }
);

interface IModelComponentJson {
  modelId: string;
}
interface IModelComponent extends IModelComponentJson {
  model: Model3D;
}

const nullModel = new Model3D(new Object3D());
export const ModelComponent: IComponentDefinition<
  IModelComponentJson,
  new () => IModelComponent
> = defineComponent(
  class ModelComponent {
    modelId = "model/null";
    model = nullModel;
    static deserialize<E extends IModelComponent>(
      entity: E,
      data: IModelComponentJson
    ) {
      entity.modelId = data.modelId!;
    }
    static canDeserialize(data: any) {
      return typeof data === "object" && "modelId" in data;
    }
    static serialize<E extends IModelComponent>(
      entity: E,
      target: IModelComponentJson
    ) {
      target.modelId = entity.modelId;
      return target;
    }
  }
);

interface IRenderOptionsComponent {
  depthTest: boolean;
  renderOrder: number;
  opacity: number;
}

type IRenderOptionsComponentJson = IRenderOptionsComponent;

export const RenderOptionsComponent: IComponentDefinition<
  IRenderOptionsComponentJson,
  new () => IRenderOptionsComponent
> = defineComponent(
  class RenderOptionsComponent {
    depthTest = true;
    renderOrder = 0;
    opacity = 1;
    static deserialize<E extends IRenderOptionsComponent>(
      entity: E,
      data: IRenderOptionsComponentJson
    ) {
      entity.depthTest = data.depthTest!;
      entity.renderOrder = data.renderOrder!;
      entity.opacity = data.opacity!;
    }
    static canDeserialize(data: any) {
      return typeof data === "object" && "depthTest" in data && "renderOrder" in data && "opacity" in data;
    }
    static serialize<E extends IRenderOptionsComponent>(
      entity: E,
      target: IRenderOptionsComponentJson
    ) {
      target.depthTest = entity.depthTest;
      target.renderOrder = entity.renderOrder;
      target.opacity = entity.opacity;
      return target;
    }
  }
);

interface IHeadingDirectionComponent {
  headingDirection: HeadingDirectionValue;
}

type IHeadingDirectionComponentJson = IHeadingDirectionComponent;

export const HeadingDirectionComponent: IComponentDefinition<
  IHeadingDirectionComponentJson,
  new () => IHeadingDirectionComponent
> = defineComponent(
  class HeadingDirectionComponent {
    headingDirection = HeadingDirectionValue.Down;

    static deserialize<E extends IHeadingDirectionComponent>(
      entity: E,
      data: IHeadingDirectionComponentJson
    ) {
      entity.headingDirection = data.headingDirection!;
    }

    static canDeserialize(data: any) {
      return typeof data === "object" && "headingDirection" in data;
    }

    static serialize<E extends IHeadingDirectionComponent>(
      entity: E,
      target: IHeadingDirectionComponentJson
    ) {
      target.headingDirection = entity.headingDirection;
      return target;
    }
  }
);

interface ITilePositionComponent {
  tilePosition: Vector3;
}

interface ITilePositionComponentJson {
  tilePosition: ITriad;
}

export const TilePositionComponent: IComponentDefinition<
  ITilePositionComponentJson,
  new () => ITilePositionComponent
> = defineComponent(
  class TilePositionComponent {
    tilePosition = new Vector3();

    static deserialize<E extends ITilePositionComponent>(
      entity: E,
      data: ITilePositionComponentJson
    ) {
      entity.tilePosition.copy(data.tilePosition);
    }

    static canDeserialize(data: any) {
      return typeof data === "object" && "tilePosition" in data;
    }

    static serialize<E extends ITilePositionComponent>(
      entity: E,
      target: ITilePositionComponentJson
    ) {
      target.tilePosition ??= { x: 0, y: 0, z: 0 };
      Vector3.prototype.copy.call(target.tilePosition, entity.tilePosition);
      return target;
    }
  }
);

interface ILevelIdComponent {
  levelId: number;
}
export const LevelIdComponent: IComponentDefinition<
  ILevelIdComponent,
  new () => ILevelIdComponent
> = defineComponent(
  class LevelIdComponent {
    levelId = 0;

    static deserialize<E extends ILevelIdComponent>(
      entity: E,
      data: ILevelIdComponent
    ) {
      entity.levelId = data.levelId;
    }

    static canDeserialize(data: any) {
      return typeof data === "object" && "levelId" in data;
    }

    static serialize<E extends ILevelIdComponent>(
      entity: E,
      target: ILevelIdComponent
    ) {
      target.levelId = entity.levelId;
      return target;
    }
  }
);

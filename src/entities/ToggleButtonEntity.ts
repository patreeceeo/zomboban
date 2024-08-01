import {
  BehaviorState,
  CameraState,
  EntityManagerState,
  TimeState
} from "../state";
import { IEntityPrefab } from "../EntityManager";
import { EntityWithComponents } from "../Component";
import {
  InSceneTag,
  AnimationComponent,
  BehaviorComponent,
  IsGameEntityTag,
  PressedTag,
  TilePositionComponent,
  ToggleableComponent,
  TransformComponent
} from "../components";
import { Behavior } from "../systems/BehaviorSystem";
import { convertToPixels } from "../units/convert";
import {
  AnimationClipJson,
  AnimationJson,
  KeyframeTrackJson
} from "../Animation";
import { CanMoveMessage, ToggleMessage } from "../messages";
import {
  CameraShakeAction,
  SetAnimationClipAction,
  TagAction,
  UntagAction
} from "../actions";
import { IQueryResults } from "../Query";
import { createMessage, sendMessage } from "../Message";
import { ASSET_IDS } from "../assets";

type BehaviorContext = TimeState & BehaviorState & CameraState;

type Entity = ReturnType<typeof ToggleButtonEntity.create>;

export class ToggleButtonBehavior extends Behavior<Entity, BehaviorContext> {
  static id = "behavior/toggleButton";
  constructor(
    readonly query: IQueryResults<
      [typeof ToggleableComponent, typeof BehaviorComponent]
    >
  ) {
    super();
  }
  #sendToggleMessages(entity: Entity, context: BehaviorContext) {
    for (const toggleableEntity of this.query) {
      const msg = createMessage(ToggleMessage)
        .from(entity)
        .to(toggleableEntity);
      sendMessage(msg, context);
    }
  }
  onUpdateLate(entity: Entity, context: BehaviorContext) {
    if (entity.actions.size > 0) {
      return;
    }

    const hasCanMoveMessage = entity.inbox.has(CanMoveMessage);
    const isPressed = PressedTag.has(entity);
    const { time } = context;
    if (hasCanMoveMessage && !isPressed) {
      this.#sendToggleMessages(entity, context);

      const actions = [
        new SetAnimationClipAction(entity, time, "press"),
        new CameraShakeAction(entity, time, 200),
        new TagAction(entity, time, PressedTag)
      ];

      return actions;
    }

    if (!hasCanMoveMessage && isPressed) {
      this.#sendToggleMessages(entity, context);
      return [
        new SetAnimationClipAction(entity, time, "default"),
        new CameraShakeAction(entity, time, 200),
        new UntagAction(entity, time, PressedTag)
      ];
    }
  }
}

export const ToggleButtonEntity: IEntityPrefab<
  EntityManagerState,
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof AnimationComponent
    | typeof TilePositionComponent
  >
> = {
  create(state) {
    const entity = state.addEntity();

    BehaviorComponent.add(entity, {
      behaviorId: ToggleButtonBehavior.id
    });

    TransformComponent.add(entity);
    const { position } = entity.transform;
    position.setZ(position.z + convertToPixels(1 as Tile));

    TilePositionComponent.add(entity);

    AnimationComponent.add(entity, {
      animation: new AnimationJson([
        new AnimationClipJson("default", 0, [
          new KeyframeTrackJson("fg", "string", [0], [ASSET_IDS.toggleButton])
        ]),
        new AnimationClipJson("press", 0, [
          new KeyframeTrackJson(
            "fg",
            "string",
            [0],
            [ASSET_IDS.toggleButtonPress]
          )
        ])
      ])
    });

    IsGameEntityTag.add(entity);

    InSceneTag.add(entity);

    return entity;
  },
  destroy(entity) {
    return entity;
  }
};

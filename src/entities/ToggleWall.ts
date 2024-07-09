import {
  AnimationClipJson,
  AnimationJson,
  KeyframeTrackJson
} from "../Animation";
import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { Message } from "../Message";
import { SetAnimationClipAction, ToggleAction } from "../actions";
import { ASSET_IDS } from "../assets";
import {
  AddedTag,
  AnimationComponent,
  BehaviorComponent,
  IsGameEntityTag,
  TilePositionComponent,
  ToggleableComponent,
  TransformComponent
} from "../components";
import { CanMoveMessage, ToggleMessage } from "../messages";
import { BehaviorState, EntityManagerState, TimeState } from "../state";
import { Behavior } from "../systems/BehaviorSystem";

type Entity = ReturnType<typeof ToggleWallEntity.create>;

export class ToggleWallBehavior extends Behavior<any, any> {
  static id = "behavior/toggleWall";
  onReceive(message: Message<any>) {
    const self = message.receiver as unknown as EntityWithComponents<
      typeof ToggleableComponent
    >;
    if (message instanceof CanMoveMessage) {
      message.answer = !self.toggleState;
    }
  }
  onUpdateLate(entity: Entity, context: TimeState) {
    if (entity.inbox.has(ToggleMessage)) {
      const { time } = context;
      return [
        new ToggleAction(entity, time),
        new SetAnimationClipAction(
          entity,
          time,
          entity.toggleState ? "off" : "default"
        )
      ];
    }
  }
}

type Context = EntityManagerState & BehaviorState;
export const ToggleWallEntity: IEntityPrefab<
  Context,
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof ToggleableComponent
    | typeof AnimationComponent
  >
> = {
  create(state) {
    const entity = state.addEntity();

    ToggleableComponent.add(entity);

    BehaviorComponent.add(entity, {
      behaviorId: ToggleWallBehavior.id
    });

    AnimationComponent.add(entity, {
      animation: new AnimationJson([
        new AnimationClipJson("default", 0, [
          new KeyframeTrackJson("fg", "string", [0], [ASSET_IDS.toggleWall])
        ]),
        new AnimationClipJson("off", 0, [
          new KeyframeTrackJson("fg", "string", [0], [ASSET_IDS.toggleWallOff])
        ])
      ])
    });

    TransformComponent.add(entity);

    TilePositionComponent.add(entity);

    IsGameEntityTag.add(entity);

    AddedTag.add(entity);

    return entity;
  },
  destroy(entity) {
    return entity;
  }
};

import {
  BehaviorState,
  EntityManagerState,
  MetaState,
  MetaStatus,
  TimeState
} from "../state";
import { IEntityPrefab } from "../EntityManager";
import { EntityWithComponents } from "../Component";
import {
  AddedTag,
  BehaviorComponent,
  HeadingDirectionComponent,
  IsGameEntityTag,
  ModelComponent,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { ASSETS } from "../constants";
import { Behavior } from "../systems/BehaviorSystem";
import { Message } from "../Message";
import { CanMoveMessage } from "../messages";
import { PlayerBehavior } from "./PlayerPrefab";

type BehaviorContext = TimeState & BehaviorState & MetaState;

type Entity = ReturnType<typeof RoosterEntity.create>;

// declare const winMessageElement: HTMLElement;
export class RoosterBehavior extends Behavior<Entity, BehaviorContext> {
  static id = "behavior/rooster";
  onUpdateEarly(_entity: ReturnType<typeof RoosterEntity.create>) {}
  onReceive(message: Message<any>, _entity: Entity, context: BehaviorContext) {
    if (message instanceof CanMoveMessage) {
      const { sender } = message;
      if (
        BehaviorComponent.has(sender) &&
        sender.behaviorId === PlayerBehavior.id
      ) {
        context.metaStatus = MetaStatus.Win;
      }
    }
  }
}

export const RoosterEntity: IEntityPrefab<
  EntityManagerState,
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof TilePositionComponent
    | typeof HeadingDirectionComponent
  >
> = {
  create(state) {
    const entity = state.addEntity();

    BehaviorComponent.add(entity, {
      behaviorId: RoosterBehavior.id
    });

    TransformComponent.add(entity);

    TilePositionComponent.add(entity);

    ModelComponent.add(entity, {
      modelId: ASSETS.rooster
    });

    HeadingDirectionComponent.add(entity);

    IsGameEntityTag.add(entity);

    AddedTag.add(entity);

    return entity;
  },
  destroy(entity) {
    return entity;
  }
};

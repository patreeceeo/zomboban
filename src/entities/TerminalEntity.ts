import {
  BehaviorState,
  EntityManagerState,
  MetaState,
  TimeState
} from "../state";
import { IEntityPrefab } from "../EntityManager";
import { EntityWithComponents } from "../Component";
import {
  InSceneTag,
  BehaviorComponent,
  IsGameEntityTag,
  ModelComponent,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { Behavior } from "../systems/BehaviorSystem";
import { Message } from "../Message";
import { CanMoveMessage } from "../messages";
import { PlayerBehavior } from "./PlayerPrefab";
import { ASSET_IDS } from "../assets";

type BehaviorContext = TimeState & BehaviorState & MetaState;

type Entity = ReturnType<typeof TerminalEntity.create>;

export class TerminalBehavior extends Behavior<Entity, BehaviorContext> {
  static id = "behavior/terminal";
  onUpdateEarly(_entity: ReturnType<typeof TerminalEntity.create>) {}
  onReceive(message: Message<any>, _entity: Entity, context: BehaviorContext) {
    if (message instanceof CanMoveMessage) {
      const { sender } = message;
      if (
        BehaviorComponent.has(sender) &&
        sender.behaviorId === PlayerBehavior.id
      ) {
        context.currentLevelId++;
      }
    }
  }
}

export const TerminalEntity: IEntityPrefab<
  EntityManagerState,
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof TilePositionComponent
  >
> = {
  create(state) {
    const entity = state.addEntity();

    BehaviorComponent.add(entity, {
      behaviorId: TerminalBehavior.id
    });

    TransformComponent.add(entity);

    TilePositionComponent.add(entity);

    ModelComponent.add(entity, {
      modelId: ASSET_IDS.terminal
    });

    IsGameEntityTag.add(entity);

    InSceneTag.add(entity);

    return entity;
  },
  destroy(entity) {
    return entity;
  }
};

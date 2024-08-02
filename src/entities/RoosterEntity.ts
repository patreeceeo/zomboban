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
  HeadingDirectionComponent,
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

// declare const winMessageElement: HTMLElement;
export class TerminalBehavior extends Behavior<Entity, BehaviorContext> {
  static id = "behavior/terminal";
  onUpdateEarly(_entity: ReturnType<typeof TerminalEntity.create>) {}
  onReceive(message: Message<any>, _entity: Entity) {
    if (message instanceof CanMoveMessage) {
      const { sender } = message;
      if (
        BehaviorComponent.has(sender) &&
        sender.behaviorId === PlayerBehavior.id
      ) {
        // context.metaStatus = MetaStatus.Win;
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
    | typeof HeadingDirectionComponent
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

    HeadingDirectionComponent.add(entity);

    IsGameEntityTag.add(entity);

    InSceneTag.add(entity);

    return entity;
  },
  destroy(entity) {
    return entity;
  }
};

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
  TransformComponent,
  CanDeleteTag
} from "../components";
import { Behavior } from "../systems/BehaviorSystem";
import { Message } from "../Message";
import { CanMoveMessage } from "../messages";
import { ASSET_IDS } from "../assets";

type BehaviorContext = TimeState & BehaviorState & MetaState;

type Entity = ReturnType<typeof GrassEntity.create>;

export class GrassBehavior extends Behavior<Entity, BehaviorContext> {
  static id = "behavior/grass";
  onUpdateEarly(_entity: ReturnType<typeof GrassEntity.create>) {}
  onReceive(message: Message<any>, entity: Entity, _context: BehaviorContext) {
    // TODO wouldn't it be nice if I could use double dispatch?
    if (message instanceof CanMoveMessage) {
      if (message.sender.behaviorId === "behavior/player") {
        message.answer = false;
      }
      if (message.sender.behaviorId === "behavior/monster") {
        CanDeleteTag.add(entity);
      }
    }
  }
}

export const GrassEntity: IEntityPrefab<
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
      behaviorId: GrassBehavior.id
    });

    TransformComponent.add(entity);

    TilePositionComponent.add(entity);

    ModelComponent.add(entity, {
      modelId: ASSET_IDS.grass
    });

    IsGameEntityTag.add(entity);

    InSceneTag.add(entity);

    return entity;
  },
  destroy(entity) {
    return entity;
  }
};

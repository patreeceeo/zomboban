import { Vector3 } from "three";
import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { MoveAction } from "../actions";
import {
  AddedTag,
  BehaviorComponent,
  IsGameEntityTag,
  ModelComponent,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { ASSETS } from "../constants";
import {
  BehaviorState,
  EntityManagerState,
  TilesState,
  TimeState
} from "../state";
import { Behavior, hasSameBehavior } from "../systems/BehaviorSystem";
import { CanMoveMessage } from "../messages";
import { Message } from "../Message";

type Entity = ReturnType<typeof BlockEntity.create>;
type BehaviorContext = TimeState & BehaviorState & TilesState;

export class BlockBehavior extends Behavior<any, any> {
  static id = "behavior/block";
  onUpdateLate(entity: Entity, context: TimeState) {
    if (entity.actions.size !== 0) return; // EARLY RETURN!
    // Determine whether to move and in what direction, using the correspondence in my inbox
    const messages = entity.inbox.getAll(CanMoveMessage);
    let deltaX = 0;
    let deltaY = 0;
    for (const { answer, delta } of messages) {
      if (answer) {
        deltaX += delta.x;
        deltaY += delta.y;
      }
    }
    if (deltaX !== 0 || deltaY !== 0) {
      return [
        new MoveAction(entity, context.time, new Vector3(deltaX, deltaY))
      ];
    }
  }
  onReceive(message: Message<any>, entity: Entity, context: BehaviorContext) {
    if (message instanceof CanMoveMessage) {
      const { sender } = message;
      if (!hasSameBehavior(entity, sender)) {
        message.forward(context);
      } else {
        message.answer = false;
      }
    }
  }
}

type Context = EntityManagerState & BehaviorState;
export const BlockEntity: IEntityPrefab<
  Context,
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof TilePositionComponent
  >
> = {
  create(state) {
    const entity = state.addEntity();

    BehaviorComponent.add(entity, {
      behaviorId: "behavior/block"
    });

    ModelComponent.add(entity, {
      modelId: ASSETS.block
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

import { Vector3 } from "three";
import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityPrefab";
import { MoveAction } from "../actions";
import {
  InSceneTag,
  BehaviorComponent,
  IsGameEntityTag,
  ModelComponent,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { ASSET_IDS } from "../assets";
import { BehaviorState, EntityManagerState, TimeState } from "../state";
import { Behavior, hasSameBehavior } from "../systems/BehaviorSystem";
import { CanMoveMessage } from "../messages";
import { Message, createMessage, getReceivers, sendMessage } from "../Message";
import { ITilesState } from "../systems/TileSystem";

type Entity = ReturnType<typeof BlockEntity.create>;
type BehaviorContext = TimeState & BehaviorState & ITilesState;

const vecInTiles = new Vector3();

export class BlockBehavior extends Behavior<any, any> {
  static id = "behavior/block";

  onUpdateEarly(entity: Entity, context: BehaviorContext) {
    const { tilePosition } = entity;

    // Send CanMoveMessage down to press buttons
    vecInTiles.copy(tilePosition);
    vecInTiles.z -= 1;
    const receivers = getReceivers(context.tiles, vecInTiles);

    for (const receiver of receivers) {
      sendMessage(
        createMessage(CanMoveMessage, vecInTiles).from(entity).to(receiver),
        context
      );
    }
  }
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
      modelId: ASSET_IDS.block
    });

    TransformComponent.add(entity);

    TilePositionComponent.add(entity);

    IsGameEntityTag.add(entity);

    InSceneTag.add(entity);

    return entity;
  },
  destroy(entity) {
    return entity;
  }
};

import { Vector3 } from "../Three";
import { BehaviorState, TimeState } from "../state";
import { ITilesState } from "../systems/TileSystem";
import { Behavior } from "../systems/BehaviorSystem";
import { EntityWithComponents } from "../Component";
import {
  BehaviorComponent,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { Message, createMessage, getReceivers, sendMessage } from "../Message";
import {
  MoveIntoBlockMessage,
  MoveIntoGolemMessage,
  MoveIntoGrassMessage,
  MoveIntoMessage,
  MoveIntoWallMessage
} from "../messages";
import { MoveAction } from "../actions";
import { invariant } from "../Error";
import { convertToPixels } from "../units/convert";
type BehaviorContext = TimeState & BehaviorState & ITilesState;
type Entity = EntityWithComponents<
  | typeof BehaviorComponent
  | typeof TransformComponent
  | typeof TilePositionComponent
>;

const vecInTiles = new Vector3();

export class BlockBehavior extends Behavior<any, any> {
  onUpdateEarly(entity: Entity, context: BehaviorContext) {
    const { tilePosition } = entity;

    // Send CanMoveMessage down to press buttons
    // TODO revisit when tile system is 3D
    vecInTiles.copy(tilePosition);
    vecInTiles.z -= 1;
    const receivers = getReceivers(context.tiles, vecInTiles);

    for (const receiver of receivers) {
      sendMessage(
        createMessage(MoveIntoMessage).from(entity).to(receiver),
        context
      );
    }
  }
  onUpdateLate(entity: Entity, context: TimeState) {
    if (entity.actions.size !== 0) return; // EARLY RETURN!
    const { inbox } = entity;
    // Determine whether to move and in what direction, using the correspondence in my inbox
    const messages = inbox.getAll(MoveIntoMessage);

    const blockingMessageCount = inbox.count([
      MoveIntoWallMessage,
      MoveIntoGolemMessage,
      MoveIntoGrassMessage,
      MoveIntoBlockMessage
    ]);

    if (blockingMessageCount > 0) {
      return [];
    }

    let deltaX = 0;
    let deltaY = 0;
    for (const { response, sender } of messages) {
      // console.log("Response from MoveIntoMessage in block's inbox", response);
      if (response) {
        invariant(
          TilePositionComponent.has(sender),
          `Expected sending entity to have tile position`
        );
        const senderPosition = sender.tilePosition;
        const receiverPosition = entity.tilePosition;
        const delta = this.computeTileDelta(
          senderPosition,
          receiverPosition,
          vecInTiles
        );
        deltaX += convertToPixels(delta.x as Tile);
        deltaY += convertToPixels(delta.y as Tile);
      }
    }
    if (deltaX !== 0 || deltaY !== 0) {
      return [
        new MoveAction(entity, context.time, new Vector3(deltaX, deltaY))
      ];
    }
  }
  computeTileDelta(
    senderPosition: Vector3,
    receiverPosition: Vector3,
    target: Vector3
  ) {
    target.copy(receiverPosition).sub(senderPosition);
    return target;
  }
  computeNextTilePosition(
    senderPosition: Vector3,
    receiverPosition: Vector3,
    target: Vector3
  ) {
    this.computeTileDelta(senderPosition, receiverPosition, target);
    target.add(receiverPosition);
    return target;
  }
  messageHandlers = {
    [MoveIntoWallMessage.type]: () => false,
    [MoveIntoMessage.type]: (
      entity: Entity,
      context: BehaviorContext,
      message: Message<any>
    ) => {
      // console.log("block received MoveInto from", message.sender.behaviorId);
      const { sender } = message;

      sendMessage(new MoveIntoBlockMessage(sender, entity), context);

      if (context.getBehavior(sender.behaviorId) instanceof BlockBehavior) {
        return false;
      }

      invariant(
        TilePositionComponent.has(sender),
        `Expected sending entity to have tile position`
      );
      const senderPosition = sender.tilePosition;
      const receiverPosition = entity.tilePosition;
      const nextTilePosition = this.computeNextTilePosition(
        senderPosition,
        receiverPosition,
        vecInTiles
      );

      const nextReceivers = getReceivers(context.tiles, nextTilePosition);

      let canMove = true;
      for (const nextReceiver of nextReceivers) {
        // console.log("block sends MoveInto to", nextReceiver.behaviorId);
        const response = sendMessage(
          new MoveIntoMessage(nextReceiver, entity),
          context
        );
        // console.log("response from block's MoveInto", response);
        if (response !== undefined) {
          canMove &&= response;
        }
      }

      return canMove;
    }
  };
}

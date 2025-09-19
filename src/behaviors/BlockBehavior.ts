import { Vector3 } from "three";
import { State } from "../state";
import { Behavior } from "../systems/BehaviorSystem";
import { EntityWithComponents } from "../Component";
import {
  BehaviorComponent,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { Message, MessageAnswer, sendMessage, sendMessageToTile } from "../Message";
import { MoveMessage, PressMessage } from "../messages";
import { MoveAction } from "../actions";
import {Action} from "../Action";
import {ActionSystem} from "../systems/ActionSystem";
import { isEntityOverlappingTile } from "../functions/Vector3";
import {invariant} from "../Error";
type Entity = EntityWithComponents<
  | typeof BehaviorComponent
  | typeof TransformComponent
  | typeof TilePositionComponent
>;

const vecInTiles = new Vector3();
const MOVE_DURATION = 75;

class BlockBehavior extends Behavior<any, any> {
  onUpdateEarly(entity: Entity, context: State) {
    const { tilePosition } = entity;

    sendMessageToTile(new PressMessage(entity), tilePosition, context);
  }
  onUpdateLate(entity: Entity, context: State) {
    const actions = [] as Action<any, any>[];
    const { inbox } = entity;
    // Determine whether to despawn
    const intoFireMessages = inbox.getAll(MoveMessage.IntoFire);
    if(intoFireMessages.size > 0) {
      context.world.removeEntity(entity);
    }

    // Determine whether I'm being pushed and in what direction, using the correspondence in my inbox
    const intoMessages = inbox.getAll(MoveMessage.Into);

    let deltaX = 0;
    let deltaY = 0;
    for (const msg of intoMessages) {
      // console.log("Response from MoveIntoMessage in block's inbox", response);
      const response = msg.reduceResponses();

      if (response === MoveMessage.Response.Allowed) {
        const senderPosition = msg.sender.tilePosition;
        const receiverPosition = entity.tilePosition;
        const delta = this.computeTileDelta(
          senderPosition,
          receiverPosition,
          vecInTiles
        );
        deltaX += delta.x;
        deltaY += delta.y;
      }
    }

    if (deltaX !== 0 || deltaY !== 0) {
      // fast-forward any pending move actions
      for (const action of entity.actions.getAll(MoveAction)) {
        action.timeOffset = action.maxElapsedTime;
        ActionSystem.updateAction(action, context);
      }
      actions.push(
        new MoveAction(
          entity,
          context.time.time,
          MOVE_DURATION,
          new Vector3(deltaX, deltaY)
        )
      );
    }
    return actions;
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
    [MoveMessage.IntoWall.type]: () => MoveMessage.Response.Blocked,
    [MoveMessage.IntoPlayer.type]: () => MoveMessage.Response.Blocked,
    [MoveMessage.IntoBlock.type]: () => MoveMessage.Response.Blocked,
    [MoveMessage.Into.type]: (
      entity: Entity,
      context: State,
      message: Message<any>
    ): MessageAnswer<MoveMessage.Into> => {
      // Get the target tile from the message
      const targetTile = message.targetTilePosition;
      invariant(targetTile !== undefined, "Target tile position is undefined in MoveMessage.Into");

      // Check if we're overlapping the target tile
      const isOverlapping = isEntityOverlappingTile(entity.transform.position, targetTile);

      // Only block if overlapping AND it's not our current logical position
      // This allows pushing from our current position but blocks intermediate tiles
      const isCurrentPosition = (targetTile.x === entity.tilePosition.x &&
                                 targetTile.y === entity.tilePosition.y);

      if (isOverlapping && !isCurrentPosition) {
        return MoveMessage.Response.Blocked;
      }

      // If not overlapping, proceed with normal block pushing logic
      const { sender } = message;

      const response = sendMessage(
        new MoveMessage.IntoBlock(entity),
        sender,
        context
      ).reduceResponses();

      if (
        response === MoveMessage.Response.Blocked
      ) {
        return MoveMessage.Response.Blocked;
      }

      const senderPosition = sender.tilePosition;
      const receiverPosition = entity.tilePosition;
      const nextTilePosition = this.computeNextTilePosition(
        senderPosition,
        receiverPosition,
        vecInTiles
      );

      return sendMessageToTile(new MoveMessage.Into(entity), nextTilePosition, context).reduceResponses()!
    }
  };
}

export default BlockBehavior;

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
import { Message, MessageAnswer, sendMessage, sendMessageToTile } from "../Message";
import { MoveMessage, PressMessage } from "../messages";
import { MoveAction } from "../actions";
import { CanDeleteTag } from "../components";
import { invariant } from "../Error";
import {Action} from "../Action";
import {ActionSystem} from "../systems/ActionSystem";
type BehaviorContext = TimeState & BehaviorState & ITilesState;
type Entity = EntityWithComponents<
  | typeof BehaviorComponent
  | typeof TransformComponent
  | typeof TilePositionComponent
>;

const vecInTiles = new Vector3();
const MOVE_DURATION = 75;

export class BlockBehavior extends Behavior<any, any> {
  onUpdateEarly(entity: Entity, context: BehaviorContext) {
    const { tilePosition } = entity;

    sendMessageToTile(new PressMessage(entity), tilePosition, context);
  }
  onUpdateLate(entity: Entity, context: TimeState) {
    const actions = [] as Action<any, any>[];
    const { inbox } = entity;
    // Determine whether to despawn
    const intoFireMessages = inbox.getAll(MoveMessage.IntoFire);
    if(intoFireMessages.size > 0) {
      CanDeleteTag.add(entity);
    }

    // Determine whether I'm being pushed and in what direction, using the correspondence in my inbox
    const intoMessages = inbox.getAll(MoveMessage.Into);

    let deltaX = 0;
    let deltaY = 0;
    for (const { response, sender } of intoMessages) {
      // console.log("Response from MoveIntoMessage in block's inbox", response);
      if (response === undefined || response === MoveMessage.Response.Allowed) {
        const senderPosition = sender.tilePosition;
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
          context.time,
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
      context: BehaviorContext,
      message: Message<any>
    ): MessageAnswer<MoveMessage.Into> => {
      const { sender } = message;

      // TODO remove this message send and its handlers
      const response = sendMessage(
        new MoveMessage.IntoBlock(entity),
        sender,
        context
      )

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

      return MoveMessage.reduceResponses(
        sendMessageToTile(new MoveMessage.Into(entity), nextTilePosition, context)
      );
    }
  };
}

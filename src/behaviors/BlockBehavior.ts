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
import { Message, MessageAnswer, sendMessage } from "../Message";
import { MoveMessage } from "../messages";
import { DespawnAction, MoveAction } from "../actions";
import { invariant } from "../Error";
import { convertToPixels } from "../units/convert";
import {Action} from "../Action";
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

    sendMessage(new MoveMessage.Into(entity), vecInTiles, context);
  }
  onUpdateLate(entity: Entity, context: TimeState) {
    if (entity.actions.size !== 0) return; // EARLY RETURN!
    const actions = [] as Action<any, any>[];
    const { inbox } = entity;
    // Determine whether to despawn
    const intoFireMessages = inbox.getAll(MoveMessage.IntoFire);
    if(intoFireMessages.size > 0) {
      actions.push(
        new DespawnAction(entity, context.time),
      )
    }

    // Determine whether to move and in what direction, using the correspondence in my inbox
    const intoMessages = inbox.getAll(MoveMessage.Into);

    let deltaX = 0;
    let deltaY = 0;
    for (const { response, sender } of intoMessages) {
      // console.log("Response from MoveIntoMessage in block's inbox", response);
      if (response === undefined || response === MoveMessage.Response.Allowed) {
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
        deltaX += convertToPixels(delta.x as Tiles);
        deltaY += convertToPixels(delta.y as Tiles);
      }
    }
    if (deltaX !== 0 || deltaY !== 0) {
      actions.push(
        new MoveAction(
          entity,
          context.time,
          new Vector3(deltaX / 64, deltaY / 64)
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

      if (
        MoveMessage.reduceResponses(
          sendMessage(
            new MoveMessage.IntoBlock(entity),
            sender.tilePosition,
            context
          )
        ) === MoveMessage.Response.Blocked
      ) {
        return MoveMessage.Response.Blocked;
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

      return MoveMessage.reduceResponses(
        sendMessage(new MoveMessage.Into(entity), nextTilePosition, context)
      );
    }
  };
}

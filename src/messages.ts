import { Vector3 } from "three";
import {
  IMessageReceiver,
  IMessageSender,
  Message,
  createMessage,
  sendMessage
} from "./Message";
import { BehaviorState, TilesState } from "./state";
import { TileEntity } from "./systems/TileSystem";
import { invariant } from "./Error";
import { TilePositionComponent } from "./components";
import { convertToTiles } from "./units/convert";

/** Ask an actor if it can move from its current position to its position plus `delta`. */
export class CanMoveMessage extends Message<boolean> {
  answer = true;
  constructor(
    receiver: IMessageReceiver,
    sender: IMessageSender,
    readonly delta: Vector3
  ) {
    super(receiver, sender);
  }

  static getReceiver(
    delta: Vector3,
    senderTilePosition: Vector3,
    context: TilesState
  ) {
    const { x, y } = senderTilePosition;
    const dx = convertToTiles(delta.x);
    const dy = convertToTiles(delta.y);
    return context.tiles.get(x + dx, y + dy) as TileEntity & IMessageReceiver;
  }

  forward(context: TilesState & BehaviorState) {
    const nextSender = this.receiver;
    invariant(
      TilePositionComponent.has(nextSender),
      `Expected receiver to have tile position component`
    );
    invariant("outbox" in nextSender, "Expected receiver to have an outbox");
    const { delta } = this;
    const nextReceiver = CanMoveMessage.getReceiver(
      delta,
      nextSender.tilePosition,
      context
    );
    if (nextReceiver) {
      return (this.answer = sendMessage(
        createMessage(CanMoveMessage, delta)
          .from(nextSender as IMessageSender)
          .to(nextReceiver),
        context
      ));
    }
  }
}

export class WinMessage extends Message<void> {}

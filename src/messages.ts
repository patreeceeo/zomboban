import { Vector3 } from "three";
import {
  IMessageReceiver,
  IMessageSender,
  Message,
  createMessage,
  getReceivers,
  sendMessage
} from "./Message";
import { BehaviorState } from "./state";
import { invariant } from "./Error";
import { TilePositionComponent } from "./components";
import { convertPropertiesToTiles } from "./units/convert";
import { ITilesState } from "./systems/TileSystem";

const vecInTiles = new Vector3();

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

  forward(context: ITilesState & BehaviorState) {
    const nextSender = this.receiver;
    invariant(
      TilePositionComponent.has(nextSender),
      `Expected receiver to have tile position component`
    );
    invariant("outbox" in nextSender, "Expected receiver to have an outbox");
    const { delta } = this;
    vecInTiles.copy(delta);
    convertPropertiesToTiles(vecInTiles);
    vecInTiles.add(nextSender.tilePosition);
    const nextReceivers = getReceivers(context.tiles, vecInTiles);

    for (const nextReceiver of nextReceivers) {
      return (this.answer &&= sendMessage(
        createMessage(CanMoveMessage, delta)
          .from(nextSender as IMessageSender)
          .to(nextReceiver),
        context
      ));
    }
  }
}

export class ToggleMessage extends Message<void> {}

export class WinMessage extends Message<void> {}

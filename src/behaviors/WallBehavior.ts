import { Message } from "../Message";
import { CanMoveMessage } from "../messages";
import { Behavior } from "../systems/BehaviorSystem";

export class WallBehavior extends Behavior<any, any> {
  onReceive(message: Message<any>) {
    if (message instanceof CanMoveMessage) {
      message.answer = false;
    }
  }
}

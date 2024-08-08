import { Message } from "../Message";
import { CanMoveMessage } from "../messages";
import { Behavior } from "../systems/BehaviorSystem";

export class WallBehavior extends Behavior<any, any> {
  static id = "behavior/wall";
  onReceive(message: Message<any>) {
    if (message instanceof CanMoveMessage) {
      message.answer = false;
    }
  }
}

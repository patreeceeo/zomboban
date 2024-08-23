import { Message } from "../Message";
import { MoveIntoMessage } from "../messages";
import { Behavior } from "../systems/BehaviorSystem";

export class WallBehavior extends Behavior<any, any> {
  onReceive(message: Message<any>) {
    if (message instanceof MoveIntoMessage) {
      message.answer = false;
    }
  }
}

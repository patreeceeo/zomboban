import { EntityWithComponents } from "../Component";
import { Message, sendMessage } from "../Message";
import { BehaviorComponent } from "../components";
import { MoveIntoMessage, MoveIntoWallMessage } from "../messages";
import { BehaviorState } from "../state";
import { Behavior } from "../systems/BehaviorSystem";
import { ITilesState } from "../systems/TileSystem";

type BehaviorContext = ITilesState & BehaviorState;
type Entity = EntityWithComponents<typeof BehaviorComponent>;

export class WallBehavior extends Behavior<any, any> {
  messageHandlers = {
    [MoveIntoMessage.type]: (
      entity: Entity,
      context: BehaviorContext,
      message: Message<any>
    ) => {
      sendMessage(new MoveIntoWallMessage(message.sender, entity), context);
      return false;
    }
  };
}

import { EntityWithComponents } from "../Component";
import { Message, sendMessage } from "../Message";
import { BehaviorComponent, TilePositionComponent } from "../components";
import { MoveMessage } from "../messages";
import { BehaviorState } from "../state";
import { Behavior } from "../systems/BehaviorSystem";
import { ITilesState } from "../systems/TileSystem";

type BehaviorContext = ITilesState & BehaviorState;
type Entity = EntityWithComponents<
  typeof BehaviorComponent | typeof TilePositionComponent
>;

export class WallBehavior extends Behavior<any, any> {
  messageHandlers = {
    [MoveMessage.Into.type]: (
      entity: Entity,
      context: BehaviorContext,
      message: Message<any>
    ) =>
      MoveMessage.reduceResponses(
        sendMessage(
          new MoveMessage.IntoWall(entity),
          message.sender.tilePosition,
          context
        )
      )
  };
}

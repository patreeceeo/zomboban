import { State } from "../state";
import { Behavior } from "../systems/BehaviorSystem";
import { Message, sendMessage} from "../Message";
import { MoveMessage } from "../messages";
import { EntityWithComponents } from "../Component";
import { BehaviorComponent, TilePositionComponent } from "../components";

type Entity = EntityWithComponents<
  typeof BehaviorComponent | typeof TilePositionComponent
>;

class TerminalBehavior extends Behavior<Entity, State> {
  onUpdateEarly(_entity: Entity) {}
  messageHandlers = {
    [MoveMessage.Into.type]: (
      entity: Entity,
      context: State,
      message: Message<any>
    ) =>
      sendMessage(
        new MoveMessage.IntoTerminal(entity),
        message.sender,
        context
      ).reduceResponses()
  };
}

export default TerminalBehavior;

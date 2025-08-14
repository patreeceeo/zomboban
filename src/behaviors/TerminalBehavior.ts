import { State } from "../state";
import { Behavior } from "../systems/BehaviorSystem";
import { Message, sendMessage} from "../Message";
import { MoveMessage } from "../messages";
import { EntityWithComponents } from "../Component";
import { BehaviorComponent, TilePositionComponent } from "../components";
import { getHMRSupport } from "../HMR";

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

if (import.meta.hot) {
  let oldBehaviorCtor = TerminalBehavior;
  const hmrSupport = getHMRSupport();
  import.meta.hot.accept((newMod) => {
    if (newMod !== undefined) {
      const newBehaviorCtor = newMod.TerminalBehavior;

      hmrSupport.state.replaceBehavior(oldBehaviorCtor, newBehaviorCtor);

      oldBehaviorCtor = newBehaviorCtor;
    }
  });
}

export default TerminalBehavior;

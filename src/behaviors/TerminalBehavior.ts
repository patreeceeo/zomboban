import { State } from "../state";
import { Behavior } from "../systems/BehaviorSystem";
import { Message, sendMessage} from "../Message";
import { MoveMessage } from "../messages";
import { EntityWithComponents } from "../Component";
import { BehaviorComponent, TilePositionComponent } from "../components";
import { ITilesState } from "../systems/TileSystem";
import { getHMRSupport } from "../HMR";

type BehaviorContext = ITilesState & State;

type Entity = EntityWithComponents<
  typeof BehaviorComponent | typeof TilePositionComponent
>;

class TerminalBehavior extends Behavior<Entity, BehaviorContext> {
  onUpdateEarly(_entity: Entity) {}
  messageHandlers = {
    [MoveMessage.Into.type]: (
      entity: Entity,
      context: BehaviorContext,
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

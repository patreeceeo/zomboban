import { BehaviorState } from "../state";
import { Behavior } from "../systems/BehaviorSystem";
import { Message, sendMessage } from "../Message";
import { MoveIntoTerminalMessage, MoveIntoMessage } from "../messages";
import { EntityWithComponents } from "../Component";
import { BehaviorComponent } from "../components";
import { ITilesState } from "../systems/TileSystem";
import { getHMRSupport } from "../HMR";

type BehaviorContext = ITilesState & BehaviorState;

type Entity = EntityWithComponents<typeof BehaviorComponent>;

export class TerminalBehavior extends Behavior<Entity, BehaviorContext> {
  onUpdateEarly(_entity: Entity) {}
  messageHandlers = {
    [MoveIntoMessage.type]: (
      entity: Entity,
      context: BehaviorContext,
      message: Message<any>
    ) =>
      sendMessage(new MoveIntoTerminalMessage(message.sender, entity), context)
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

import { BehaviorState } from "../state";
import { Behavior } from "../systems/BehaviorSystem";
import { Message, sendMessage } from "../Message";
import { MoveMessage } from "../messages";
import { EntityWithComponents } from "../Component";
import { BehaviorComponent, TilePositionComponent } from "../components";
import { ITilesState } from "../systems/TileSystem";
import { getHMRSupport } from "../HMR";

type BehaviorContext = ITilesState & BehaviorState;

type Entity = EntityWithComponents<
  typeof BehaviorComponent | typeof TilePositionComponent
>;

export class TerminalBehavior extends Behavior<Entity, BehaviorContext> {
  onUpdateEarly(_entity: Entity) {}
  messageHandlers = {
    [MoveMessage.Into.type]: (
      entity: Entity,
      context: BehaviorContext,
      message: Message<any>
    ) =>
      MoveMessage.reduceResponses(
        sendMessage(
          new MoveMessage.IntoTerminal(entity),
          message.sender.tilePosition,
          context
        )
      )
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

import {Action} from "../Action";
import { Message, MessageAnswer, sendMessage } from "../Message";
import FireEntity from "../entities/FireEntity";
import { MoveMessage, HitByMonsterMessage } from "../messages";
import { State } from "../state";
import { Behavior } from "../systems/BehaviorSystem";


type Entity = ReturnType<typeof FireEntity.create>;

class FireBehavior extends Behavior<Entity, State> {
  onUpdateEarly(_entity: Entity) {}
  onUpdateLate(entity: Entity, context: State) {
    if (entity.actions.size !== 0) return; // EARLY RETURN!
    const actions = [] as Action<any, any>[];
    const { inbox } = entity;
    // Determine whether to despawn
    const messages = inbox.getAll(HitByMonsterMessage);
    if(messages.size > 0) {
      context.world.removeEntity(entity);
    }
    return actions;
  }
  messageHandlers = {
    [MoveMessage.Into.type]: (
      entity: Entity,
      context: State,
      message: Message<any>
    ): MessageAnswer<MoveMessage.Into> => {
      return sendMessage(
        new MoveMessage.IntoFire(entity),
        message.sender,
        context
      ).reduceResponses()!
    },
  };
}

export default FireBehavior;

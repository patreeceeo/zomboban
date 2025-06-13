import {Action} from "../Action";
import { Message, MessageAnswer, sendMessage } from "../Message";
import { CanDeleteTag } from "../components";
import FireEntity from "../entities/FireEntity";
import { MoveMessage, HitByMonsterMessage } from "../messages";
import {
  BehaviorState,
  EntityManagerState,
  MetaState,
} from "../state";
import { Behavior } from "../systems/BehaviorSystem";
import { ITilesState } from "../systems/TileSystem";

type BehaviorContext =
  BehaviorState &
  MetaState &
  EntityManagerState &
  ITilesState;

type Entity = ReturnType<typeof FireEntity.create>;

export class FireBehavior extends Behavior<Entity, BehaviorContext> {
  onUpdateEarly(_entity: Entity) {}
  onUpdateLate(entity: Entity) {
    if (entity.actions.size !== 0) return; // EARLY RETURN!
    const actions = [] as Action<any, any>[];
    const { inbox } = entity;
    // Determine whether to despawn
    const messages = inbox.getAll(HitByMonsterMessage);
    if(messages.size > 0) {
      CanDeleteTag.add(entity);
    }
    return actions;
  }
  messageHandlers = {
    [MoveMessage.Into.type]: (
      entity: Entity,
      context: BehaviorContext,
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

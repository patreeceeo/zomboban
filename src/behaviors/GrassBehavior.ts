import { Message, sendMessage } from "../Message";
import { CanDeleteTag } from "../components";
import GrassEntity from "../entities/GrassEntity";
import {
  MoveIntoGrassMessage,
  MoveIntoMessage,
  HitByGolemMessage
} from "../messages";
import {
  BehaviorState,
  EntityManagerState,
  MetaState,
  TimeState
} from "../state";
import { Behavior } from "../systems/BehaviorSystem";

type BehaviorContext = TimeState &
  BehaviorState &
  MetaState &
  EntityManagerState;

type Entity = ReturnType<typeof GrassEntity.create>;

export class GrassBehavior extends Behavior<Entity, BehaviorContext> {
  onUpdateEarly(_entity: Entity) {}
  messageHandlers = {
    [MoveIntoMessage.type]: (
      entity: Entity,
      context: BehaviorContext,
      message: Message<any>
    ) => {
      return sendMessage(
        new MoveIntoGrassMessage(message.sender, entity),
        context
      );
    },
    [HitByGolemMessage.type]: (entity: Entity, _context: BehaviorContext) => {
      CanDeleteTag.add(entity);
    }
  };
}

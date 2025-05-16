import { Message, MessageAnswer, sendMessage } from "../Message";
import { CanDeleteTag } from "../components";
import GrassEntity from "../entities/GrassEntity";
import { MoveMessage, HitByMonsterMessage } from "../messages";
import {
  BehaviorState,
  EntityManagerState,
  MetaState,
  TimeState
} from "../state";
import { Behavior } from "../systems/BehaviorSystem";
import { ITilesState } from "../systems/TileSystem";

type BehaviorContext = TimeState &
  BehaviorState &
  MetaState &
  EntityManagerState &
  ITilesState;

type Entity = ReturnType<typeof GrassEntity.create>;

export class GrassBehavior extends Behavior<Entity, BehaviorContext> {
  onUpdateEarly(_entity: Entity) {}
  messageHandlers = {
    [MoveMessage.Into.type]: (
      entity: Entity,
      context: BehaviorContext,
      message: Message<any>
    ): MessageAnswer<MoveMessage.Into> => {
      return MoveMessage.reduceResponses(
        sendMessage(
          new MoveMessage.IntoGrass(entity),
          message.sender.tilePosition,
          context
        )
      );
    },
    [HitByMonsterMessage.type]: (entity: Entity, _context: BehaviorContext) => {
      CanDeleteTag.add(entity);
    }
  };
}

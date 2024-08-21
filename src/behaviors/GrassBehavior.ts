import { BehaviorEnum } from ".";
import { Message } from "../Message";
import { CanDeleteTag } from "../components";
import GrassEntity from "../entities/GrassEntity";
import { CanMoveMessage } from "../messages";
import { BehaviorState, MetaState, TimeState } from "../state";
import { Behavior } from "../systems/BehaviorSystem";

type BehaviorContext = TimeState & BehaviorState & MetaState;

type Entity = ReturnType<typeof GrassEntity.create>;

export class GrassBehavior extends Behavior<Entity, BehaviorContext> {
  onUpdateEarly(_entity: ReturnType<typeof GrassEntity.create>) {}
  onReceive(message: Message<any>, entity: Entity, _context: BehaviorContext) {
    // TODO wouldn't it be nice if I could use double dispatch?
    if (message instanceof CanMoveMessage) {
      if (message.sender.behaviorId === BehaviorEnum.Monster) {
        CanDeleteTag.add(entity);
      } else {
        message.answer = false;
      }
    }
  }
}

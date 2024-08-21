import { BehaviorState, MetaState, TimeState } from "../state";
import { Behavior } from "../systems/BehaviorSystem";
import { Message } from "../Message";
import { CanMoveMessage } from "../messages";
import { EntityWithComponents } from "../Component";
import {
  BehaviorComponent,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { BehaviorEnum } from ".";
type BehaviorContext = TimeState & BehaviorState & MetaState;

type Entity = EntityWithComponents<
  | typeof BehaviorComponent
  | typeof TransformComponent
  | typeof TilePositionComponent
>;

export class TerminalBehavior extends Behavior<Entity, BehaviorContext> {
  onUpdateEarly(_entity: Entity) {}
  onReceive(message: Message<any>, _entity: Entity, context: BehaviorContext) {
    if (message.type === CanMoveMessage.prototype.type) {
      const { sender } = message;
      if (
        BehaviorComponent.has(sender) &&
        sender.behaviorId === BehaviorEnum.Player
      ) {
        context.currentLevelId++;
      }
    }
  }
}

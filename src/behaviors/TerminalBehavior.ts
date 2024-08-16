import { BehaviorState, MetaState, TimeState } from "../state";
import { Behavior } from "../systems/BehaviorSystem";
import { Message } from "../Message";
import { CanMoveMessage } from "../messages";
import { PlayerBehavior } from "./PlayerBehavior";
import { EntityWithComponents } from "../Component";
import {
  BehaviorComponent,
  TilePositionComponent,
  TransformComponent
} from "../components";
type BehaviorContext = TimeState & BehaviorState & MetaState;

type Entity = EntityWithComponents<
  | typeof BehaviorComponent
  | typeof TransformComponent
  | typeof TilePositionComponent
>;

export class TerminalBehavior extends Behavior<Entity, BehaviorContext> {
  static id = "behavior/terminal";
  onUpdateEarly(_entity: Entity) {}
  onReceive(message: Message<any>, _entity: Entity, context: BehaviorContext) {
    if (message instanceof CanMoveMessage) {
      const { sender } = message;
      if (
        BehaviorComponent.has(sender) &&
        sender.behaviorId === PlayerBehavior.id
      ) {
        context.currentLevelId++;
      }
    }
  }
}

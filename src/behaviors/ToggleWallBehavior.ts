import { MoveIntoMessage, ToggleMessage } from "../messages";
import { Behavior } from "../systems/BehaviorSystem";
import { SetAnimationClipAction, ToggleAction } from "../actions";
import { EntityWithComponents } from "../Component";
import {
  AnimationComponent,
  BehaviorComponent,
  ToggleableComponent,
  TransformComponent
} from "../components";
import { TimeState } from "../state";

type Entity = EntityWithComponents<
  | typeof BehaviorComponent
  | typeof TransformComponent
  | typeof ToggleableComponent
  | typeof AnimationComponent
>;

export class ToggleWallBehavior extends Behavior<any, any> {
  messageHandlers = {
    [MoveIntoMessage.type]: (entity: Entity) => {
      return !entity.toggleState;
    }
  };
  onUpdateLate(entity: Entity, context: TimeState) {
    if (entity.inbox.has(ToggleMessage)) {
      const { time } = context;
      return [
        new ToggleAction(entity, time),
        new SetAnimationClipAction(
          entity,
          time,
          entity.toggleState ? "off" : "default"
        )
      ];
    }
  }
}

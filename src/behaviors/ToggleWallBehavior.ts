import { MoveMessage, ToggleMessage } from "../messages";
import { Behavior } from "../systems/BehaviorSystem";
import { SetOpacityAction, ToggleAction } from "../actions";
import { EntityWithComponents } from "../Component";
import {
  BehaviorComponent,
  RenderOptionsComponent,
  TilePositionComponent,
  ToggleableComponent,
  TransformComponent
} from "../components";
import { BehaviorState, TimeState } from "../state";
import { Message, sendMessage } from "../Message";
import { ITilesState } from "../systems/TileSystem";

type Entity = EntityWithComponents<
  | typeof BehaviorComponent
  | typeof TransformComponent
  | typeof ToggleableComponent
  | typeof TilePositionComponent
  | typeof RenderOptionsComponent
>;

export class ToggleWallBehavior extends Behavior<any, any> {
  messageHandlers = {
    [MoveMessage.Into.type]: (
      entity: Entity,
      context: BehaviorState & ITilesState,
      message: Message<any>
    ) => {
      const msgClass = entity.toggleState
        ? MoveMessage.IntoWall
        : MoveMessage.IntoWallPlaceholder;
      const msg = new msgClass(entity);
      const responses = sendMessage(msg, message.sender.tilePosition, context);
      return MoveMessage.reduceResponses(responses);
    }
  };
  onUpdateLate(entity: Entity, context: TimeState) {
    if (entity.inbox.has(ToggleMessage)) {
      const { time } = context;
      return [
        new ToggleAction(entity, time),
        new SetOpacityAction(entity, time, entity.toggleState ? 0.3 : 1),
      ];
    }
  }
}

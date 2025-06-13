import { MoveMessage, StuckInsideWallMessage, ToggleMessage } from "../messages";
import { Behavior } from "../systems/BehaviorSystem";
import { EntityWithComponents } from "../Component";
import {
  BehaviorComponent,
  RenderOptionsComponent,
  TilePositionComponent,
  ToggleableComponent,
  TransformComponent
} from "../components";
import { BehaviorState } from "../state";
import { Message, sendMessage, sendMessageToTile } from "../Message";
import { ITilesState } from "../systems/TileSystem";
import {Action} from "../Action";
import {ActionEntity} from "../systems/ActionSystem";

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
      return sendMessage(msg, message.sender, context).reduceResponses();
    },
    [ToggleMessage.type]: (
      entity: Entity,
    ) => {
      entity.toggleState = !entity.toggleState;
      entity.opacity = entity.toggleState ? 1 : 0.3;
    }
  };
  onUpdateEarly(entity: Entity, context: any): void | Action<ActionEntity<any>, any>[] {
    if(entity.toggleState) {
      sendMessageToTile(new StuckInsideWallMessage(entity), entity.tilePosition, context);
    }
  }
}

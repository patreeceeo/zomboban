import { BehaviorState, CameraState, TimeState } from "../state";
import { MoveMessage, ToggleMessage } from "../messages";
import {
  AnimationComponent,
  BehaviorComponent,
  PressedTag,
  TilePositionComponent,
  ToggleableComponent,
  TransformComponent
} from "../components";
import { Behavior } from "../systems/BehaviorSystem";
import {
  CameraShakeAction,
  SetAnimationClipAction,
  TagAction,
  UntagAction
} from "../actions";
import { IQueryResults } from "../Query";
import { sendMessage } from "../Message";
import { EntityWithComponents } from "../Component";
import { ITilesState } from "../systems/TileSystem";
type BehaviorContext = TimeState & BehaviorState & CameraState & ITilesState;

type Entity = EntityWithComponents<
  | typeof BehaviorComponent
  | typeof TransformComponent
  | typeof AnimationComponent
  | typeof TilePositionComponent
>;

export class ToggleButtonBehavior extends Behavior<Entity, BehaviorContext> {
  constructor(
    readonly query: IQueryResults<
      [
        typeof ToggleableComponent,
        typeof BehaviorComponent,
        typeof TilePositionComponent
      ]
    >
  ) {
    super();
  }
  #sendToggleMessages(entity: Entity, context: BehaviorContext) {
    for (const toggleableEntity of this.query) {
      const msg = new ToggleMessage(entity);
      sendMessage(msg, toggleableEntity.tilePosition, context);
    }
  }
  onUpdateLate(entity: Entity, context: BehaviorContext & ITilesState) {
    if (entity.actions.size > 0) {
      return;
    }

    const hasCanMoveMessage = entity.inbox.has(MoveMessage.Into);
    const isPressed = PressedTag.has(entity);
    const { time } = context;
    if (hasCanMoveMessage && !isPressed) {
      this.#sendToggleMessages(entity, context);
      const actions = [
        new SetAnimationClipAction(entity, time, "press"),
        new CameraShakeAction(entity, time, 200),
        new TagAction(entity, time, PressedTag)
      ];

      return actions;
    }

    if (!hasCanMoveMessage && isPressed) {
      this.#sendToggleMessages(entity, context);
      return [
        new SetAnimationClipAction(entity, time, "default"),
        new CameraShakeAction(entity, time, 200),
        new UntagAction(entity, time, PressedTag)
      ];
    }
  }
}

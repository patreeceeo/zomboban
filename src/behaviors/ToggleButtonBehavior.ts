import { BehaviorState, CameraState, TimeState, QueryState } from "../state";
import { PressMessage, ToggleMessage } from "../messages";
import {
  AnimationComponent,
  BehaviorComponent,
  InSceneTag,
  IsActiveTag,
  PressedTag,
  TilePositionComponent,
  ToggleableComponent,
  TransformComponent
} from "../components";
import { Behavior } from "../systems/BehaviorSystem";
import {
  CameraShakeAction,
} from "../actions";
import { sendMessageToTile } from "../Message";
import { EntityWithComponents } from "../Component";
import { setAnimationClip } from "../util";
import { ITilesState } from "../systems/TileSystem";
type BehaviorContext = TimeState & BehaviorState & CameraState & ITilesState & QueryState;

type Entity = EntityWithComponents<
  | typeof BehaviorComponent
  | typeof TransformComponent
  | typeof AnimationComponent
  | typeof TilePositionComponent
>;

class ToggleButtonBehavior extends Behavior<Entity, BehaviorContext> {
  constructor() {
    super();
  }
  #sendToggleMessages(entity: Entity, context: BehaviorContext) {
    const toggleableEntities = context.query([
      ToggleableComponent,
      BehaviorComponent,
      TilePositionComponent,
      InSceneTag,
      IsActiveTag
    ]);
    for (const toggleableEntity of toggleableEntities) {
      const msg = new ToggleMessage(entity);
      sendMessageToTile(msg, toggleableEntity.tilePosition, context);
    }
  }
  onUpdateLate(entity: Entity, context: BehaviorContext & ITilesState) {
    if (entity.actions.size > 0) {
      return;
    }

    const hasPressMessage = entity.inbox.has(PressMessage);
    const isPressed = PressedTag.has(entity);
    const { time } = context;
    if (hasPressMessage && !isPressed) {
      this.#sendToggleMessages(entity, context);
      setAnimationClip(entity, "press");
      PressedTag.add(entity);
      const actions = [
        new CameraShakeAction(entity, time, 200)
      ];

      return actions;
    }

    if (!hasPressMessage && isPressed) {
      this.#sendToggleMessages(entity, context);
      setAnimationClip(entity, "default");
      PressedTag.remove(entity);
      return [
        new CameraShakeAction(entity, time, 200)
      ];
    }
  }
}

export default ToggleButtonBehavior;

import { EntityWithComponents } from "../Component";
import { invariant } from "../Error";
import {
  ClearMessagesAction,
  SetVisibilityAction,
  WriteMessageAction
} from "../actions";
import {
  BehaviorComponent,
  TransformComponent,
  TypewriterCursorsComponent,
  ViewportTransformComponent
} from "../components";
import { InputState, TimeState } from "../state";
import { Behavior } from "../systems/BehaviorSystem";

type Context = InputState & TimeState;
type Entity = EntityWithComponents<
  | typeof TransformComponent
  | typeof BehaviorComponent
  | typeof ViewportTransformComponent
  | typeof TypewriterCursorsComponent
>;
export class TutorialScript extends Behavior<Entity, Context> {
  id = "behavior/turorial";
  #showUntil = 0;
  #mistakeTime = 0;
  start(entity: Entity, context: Context) {
    entity.transform.visible = this.#showUntil > context.time;
  }
  mapInput(entity: Entity, context: Context) {
    invariant("default" in entity.cursors, "Expected default cursor");
    if (!context.inputUnderstood) {
      this.#mistakeTime += context.dt;
    } else {
      this.#mistakeTime = Math.max(0, this.#mistakeTime - context.dt);
    }
    if (this.#mistakeTime > 250 && this.#showUntil < context.time) {
      this.#showUntil = context.time + 5000;
      this.#mistakeTime = 0;
      return [
        new ClearMessagesAction(entity.cursors.default),
        new SetVisibilityAction(true, entity),
        new WriteMessageAction(
          entity.cursors.default,
          `Controls
  Game Mode:
    Movement: W,A,S,D or H,J,K,L
    Undo: Z

  Editor Mode:
    Movement: W,A,S,D or H,J,K,L
    Place Entity: R
    Delete Entity: X
    Save: Shift+P (must be signed in)

  Place Entity Mode:
    Player: P
    Block: B
    Cancel: Escape

  Toggle Editor/Game: Space
  Zoom in/out: Mouse wheel
  Help: hold any other key`
        )
      ];
    }

    if (this.#showUntil < context.time && entity.transform.visible) {
      return [new SetVisibilityAction(false, entity)];
    }
  }
  chain() {}
}

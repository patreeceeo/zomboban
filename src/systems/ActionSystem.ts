import { Vector2 } from "three";
import { IWorld } from "../EntityManager";
import { System } from "../System";
import { State } from "../state";
import { EntityWithComponents } from "../Component";
import { BehaviorComponent } from "../components";

/**
 * @fileoverview an application of the command pattern. I just like the word "action" better.
 * Every change to world state can be represented by an Action object, which is added to a queue to be applied.
 * Rules of Actions:
 *  - No other system should be able to mutate the game state (entity components) directly.
 *  - Once an action is added to the queue, it will be applied at the end of the frame.
 *  - Actions are immutable.
 *  - The action does what it says. Keep it simple.
 *  - Avoid control flow statements (if, switch, for, while...) in actions.
 *     - Instead, make sure that only the appropriate actions are added to the queue.
 *
 * The motivation for this is to support undo/redo.
 *
 */

export abstract class Action<
  Entity,
  Context extends ReadonlyRecursive<IWorld>
> {
  abstract bind(entity: Entity): void;
  abstract stepForward(entity: Entity, context: Context): void;
  abstract stepBackward(entity: Entity, context: Context): void;
  effectedArea: Vector2[] = [];
  isComplete = false;
}

export class ActionDriver<
  Entity extends EntityWithComponents<typeof BehaviorComponent>,
  Context extends ReadonlyRecursive<IWorld>
> {
  constructor(
    readonly action: Action<Entity, Context>,
    readonly entity: Entity
  ) {
    action.bind(entity);
    entity.actions.add(action);
  }
  stepForward(context: Context) {
    this.action.stepForward(this.entity, context);
  }
  stepBackward(cntext: Context) {
    this.action.stepBackward(this.entity, cntext);
  }
}

export class ActionSystem extends System<State> {
  update(state: State) {
    state.actions.forEach((actionSet, index) => {
      if (index < state.actionPointer) return;
      for (const action of actionSet) {
        action.stepForward(state);
      }

      let complete = true;
      for (const action of actionSet) {
        complete = complete && action.action.isComplete;
      }
      if (complete) {
        state.actionPointer++;
        for (const action of actionSet) {
          action.entity.actions.clear();
        }
      }
    });
  }
}

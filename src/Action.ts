/**
 * @fileoverview an application of the command pattern. I just like the word "action" better.
 *
 * Motivation: support undo/redo.
 *
 * Rules of Actions:
 *  - All state mutation should be done through actions.
 *  - Once an action is added to the queue, it will be applied in the current frame.
 *  - Actions should be regarded as immutable.
 *  - The action does what it says. Keep it simple.
 *  - Avoid control flow statements (if, switch, for, while...) in actions.
 *     - Instead, make sure that only the appropriate actions are added to the queue.
 *
 */

import { EntityWithComponents } from "./Component";
import { BehaviorComponent } from "./components";

/** Objects of Action! Grrr... */
export abstract class Action<
  Entity extends EntityWithComponents<typeof BehaviorComponent>,
  Context
> {
  static nextId = 0;
  static MAX_HISTORY = 1200;
  id = Action.nextId++;
  constructor(
    readonly entity: Entity,
    readonly startTime: number,
    readonly maxElapsedTime: number
  ) {}
  abstract update(context: Context): void;
  #progress = 0;
  get progress() {
    return this.#progress;
  }
  onStart() {
    this.entity.actions.add(this);
  }
  onComplete() {
    this.entity.actions.delete(this);
  }
  seek(deltaTime: number) {
    this.#progress = Math.max(
      0,
      Math.min(1, this.progress + deltaTime / this.maxElapsedTime)
    );
  }
  canUndo = true;
  humanName = this.constructor.name;
  toString() {
    return `${this.humanName} (${this.id}) startTime: ${this.startTime} endTime: ${this.endTime}`;
  }
  occursAtTime(time: number) {
    const { startTime, endTime } = this;
    return startTime < time && endTime > time;
  }
  get endTime() {
    return this.startTime + this.maxElapsedTime;
  }
  overlaps(action: Action<any, any>) {
    return (
      this.occursAtTime(action.startTime) || this.occursAtTime(action.endTime)
    );
  }
}

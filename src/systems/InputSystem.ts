import { combineKeys, parseEventKey, removeKey } from "../Input";
import { IQueryResults } from "../Query";
import { System } from "../System";
import { InputQueueComponent, IsActiveTag } from "../components";
import { State } from "../state";

export class InputSystem extends System<State> {
  #query: IQueryResults<typeof InputQueueComponent> | undefined;
  start(state: State) {
    this.#query = state.query([InputQueueComponent, IsActiveTag]);

    window.onkeydown = (event) => this.handleKeyDown(event, state);
    window.onkeyup = (event) => this.handleKeyUp(event, state);
  }
  handleKeyDown(e: KeyboardEvent, state: State) {
    const input = parseEventKey(e);
    if (input === undefined) {
      return;
    }
    state.inputPressed = combineKeys(state.inputPressed, input);
    if (e.repeat) {
      state.inputRepeating = combineKeys(state.inputRepeating, input);
    }
    state.inputs.push(state.inputPressed);
  }
  handleKeyUp(e: KeyboardEvent, state: State) {
    const input = parseEventKey(e);
    if (input === undefined) {
      return;
    }
    state.inputPressed = removeKey(state.inputPressed, input);
    state.inputRepeating = removeKey(state.inputRepeating, input);
  }
  update(state: State) {
    for (const keyCombo of state.inputs) {
      for (const entity of this.#query!) {
        const { inputs } = entity;
        inputs.push(keyCombo);
      }
    }
    state.inputs.length = 0;
  }
}

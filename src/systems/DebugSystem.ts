import { System } from "../System";
import { DebugState } from "../state";

declare const debug: HTMLElement;
export class DebugSystem extends System<DebugState> {
  update(state: DebugState) {
    debug.innerHTML = state.debugLog;
    state.debugLog = "";
  }
}

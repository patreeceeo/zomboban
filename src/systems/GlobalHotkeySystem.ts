import { createInputQueue, includesKey } from "../Input";
import { RouteId, routeTo } from "../Router";
import { KEY_MAPS } from "../constants";

const inputQueue = createInputQueue();

let editing = false;

export function GlobalHotkeySystem() {
  const newInput = inputQueue.shift();
  if (newInput !== undefined) {
    if (includesKey(newInput, KEY_MAPS.TOGGLE_EDITOR)) {
      const routeId = editing ? RouteId.EDITOR : RouteId.GAME;
      editing = !editing;
      routeTo(routeId);
    } else if (includesKey(newInput, KEY_MAPS.SHOW_MENU)) {
      routeTo(RouteId.MAIN_MENU);
    }
  }
}

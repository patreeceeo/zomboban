import { EventTypeHelper } from "./EventType";
import { IslandController } from "./Island";

export const hmrDeleteIslandController = new EventTypeHelper(
  "Zui:hmr-delete:IslandController"
);

export const hmrSetIslandController = new EventTypeHelper<IslandController>(
  "Zui:hmr-set:IslandController"
);

/** Event that is fired when there isn't a corresponding controller method for an event
 */
export const delegateEventType = new EventTypeHelper<string>("Zui:delegate");

export const showElementEvent = new EventTypeHelper("Zui:show");
export const hideElementEvent = new EventTypeHelper("Zui:hide");

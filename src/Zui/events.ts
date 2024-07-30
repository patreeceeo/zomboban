import { EventTypeHelper } from "./EventType";
import { IslandController } from "./Island";

export const hmrDeleteIslandController = new EventTypeHelper(
  "Zui:hmr-delete:IslandController"
);

export const hmrSetIslandController = new EventTypeHelper<IslandController>(
  "Zui:hmr-set:IslandController"
);

export class EventDelegation {
  constructor(
    readonly methodName: string,
    readonly eventName: string,
    readonly source: Element
  ) {}
}
/** Event that is fired when there isn't a corresponding controller method for an event
 */
export const delegateEventType = new EventTypeHelper<EventDelegation>(
  "Zui:delegate"
);

export const showElementEvent = new EventTypeHelper("Zui:show");
export const hideElementEvent = new EventTypeHelper("Zui:hide");

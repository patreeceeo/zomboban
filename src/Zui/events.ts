import { EventType } from "./EventType";
import { IslandController } from "./Island";

export const hmrDeleteIslandController = new EventType(
  "Zui:hmr-delete:IslandController"
);

export const hmrSetIslandController = new EventType<IslandController>(
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
export const delegateEventType = new EventType<EventDelegation>("Zui:delegate");

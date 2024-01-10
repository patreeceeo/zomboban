import { Rectangle } from "./Rectangle";
import { SetMap } from "./SetMap";

export enum EventType {
  TEST_ACTION,
  START_ACTION,
  COMPLETE_ACTION,
}

export class Event<Data> {
  isCancelled = false;
  constructor(
    readonly type: EventType,
    readonly data: Data,
    readonly effectedArea: Rectangle,
  ) {}
}

interface EventHandler<EventData> {
  (event: Event<EventData>): void;
}

const EVENT_HANDLERS = new SetMap<EventType, EventHandler<any>>();

export function dispatchEvent<EventData>(event: Event<EventData>) {
  for (const handler of EVENT_HANDLERS.getValuesIfHasKey(event.type)) {
    handler(event);
  }
}
export function addEventListener<EventData>(
  type: EventType,
  handler: EventHandler<EventData>,
) {
  EVENT_HANDLERS.add(type, handler);
}
export function removeEventListener<EventData>(
  type: EventType,
  handler: EventHandler<EventData>,
) {
  EVENT_HANDLERS.deleteValue(type, handler);
}

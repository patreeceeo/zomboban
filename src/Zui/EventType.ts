interface CustomEventListener<Detail> {
  (evt: CustomEvent<Detail>): void;
}

export type EventTypeForHelper<Helper extends EventTypeHelper<any>> =
  Helper extends EventTypeHelper<infer Detail> ? CustomEvent<Detail> : never;

export class EventTypeHelper<Detail = void> {
  constructor(readonly eventName: string) {}
  trigger(target: EventTarget, detail: Detail) {
    const event = new CustomEvent(this.eventName, { bubbles: true, detail });
    target.dispatchEvent(event);
  }
  map(event: Event, detail: Detail) {
    const { target } = event;
    if (target !== null) {
      this.trigger(target, detail);
    }
  }

  receiveOn(
    target: EventTarget,
    listener: CustomEventListener<Detail>,
    options?: EventListenerOptions
  ) {
    target.addEventListener(this.eventName, listener as any, options);
  }
}

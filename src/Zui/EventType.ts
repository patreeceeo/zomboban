interface CustomEventListener {
  (evt: CustomEvent): void;
}

export class EventType<Detail = void> {
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
    listener: CustomEventListener,
    options?: EventListenerOptions
  ) {
    target.addEventListener(this.eventName, listener as any, options);
  }
}

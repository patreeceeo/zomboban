type AddEventListenerArguments = Parameters<EventTarget["addEventListener"]>;

export class EventType {
  constructor(readonly eventName: string) {}
  trigger(target: EventTarget) {
    const event = new CustomEvent(this.eventName, { bubbles: true });
    target.dispatchEvent(event);
  }
  map(event: Event) {
    const { target } = event;
    if (target !== null) {
      this.trigger(target);
    }
  }

  mapHandler = this.map.bind(this);

  receiveOn(
    target: EventTarget,
    listener: AddEventListenerArguments[1],
    options?: AddEventListenerArguments[2]
  ) {
    target.addEventListener(this.eventName, listener, options);
  }
}

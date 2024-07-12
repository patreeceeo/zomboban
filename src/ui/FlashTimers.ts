export class FlashQueue {
  #flashTimers = new Map<Element, number>();
  constructor(
    readonly element: HTMLElement,
    public timeout = 2000
  ) {}
  update(dt: number) {
    const flashTimers = this.#flashTimers;
    const { timeout } = this;
    for (const el of this.element.children) {
      let time = flashTimers.get(el) ?? 0;
      time += dt;
      if (time < timeout) {
        flashTimers.set(el, time);
      } else {
        el.remove();
        flashTimers.delete(el);
      }
    }
  }
}

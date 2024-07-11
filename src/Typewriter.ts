import { invariant } from "./Error";
import { delay } from "./util";

export class Typewriter {
  createCursor() {
    return new Cursor();
  }
}

export interface ITypewriterTargetData {
  outputHeight: number;
}

declare const logElement: HTMLElement;

class Cursor {
  #destroyed = false;
  constructor(
    parent = logElement,
    readonly target = document.createElement("span")
  ) {
    parent.appendChild(target);
  }
  addLineBreak() {
    invariant(!this.#destroyed, "Cursor has been destroyed");
    const lineBreak = document.createElement("br");
    this.target.appendChild(lineBreak);
  }
  async writeAsync(text: string) {
    invariant(!this.#destroyed, "Cursor has been destroyed");
    for (const char of text) {
      switch (char) {
        case "\n":
          this.addLineBreak();
          break;
        default: {
          const textNode = document.createTextNode(char);
          this.target.appendChild(textNode);
          break;
        }
      }
      await delay(1);
    }
  }
  clone() {
    invariant(!this.#destroyed, "Cursor has been destroyed");
    return new Cursor(this.target);
  }
  clear() {
    invariant(!this.#destroyed, "Cursor has been destroyed");
    this.target.innerHTML = "";
  }
  destroy() {
    this.clear();
    this.target.remove();
    this.#destroyed = true;
  }
}

export type ITypewriterCursor = Cursor;

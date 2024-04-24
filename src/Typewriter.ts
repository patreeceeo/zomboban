import { delay } from "./util";

export class Typewriter {
  createCursor() {
    return new Cursor();
  }
}

export interface ITypewriterTargetData {
  outputHeight: number;
}

declare const DOMOverlay: HTMLElement;

class Cursor {
  constructor(
    parent = DOMOverlay,
    readonly target = document.createElement("span")
  ) {
    parent.appendChild(target);
  }
  addLineBreak() {
    const lineBreak = document.createElement("br");
    this.target.appendChild(lineBreak);
  }
  async writeAsync(text: string) {
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
    return new Cursor(this.target);
  }
  clear() {
    this.target.innerHTML = "";
  }
}

export type ITypewriterCursor = Cursor;

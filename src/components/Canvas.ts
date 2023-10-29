import {invariant} from "../Error";

export class Canvas {
  #canvas: HTMLCanvasElement;
  constructor() {
    this.#canvas = document.createElement("canvas");
  }
  set width(value: number) {
    this.#canvas.width = value;
  }
  set height(value: number) {
    this.#canvas.height = value;
  }
  get renderingContext2d(): CanvasRenderingContext2D {
    const context = this.#canvas.getContext("2d");
    invariant(context !== null, "CanvasRenderingContext2D is null");
    return context!;
  }
  mount(element: HTMLElement) {
    element.appendChild(this.#canvas);
  }
}

const DATA: Array<Canvas> = [];

export function setCanvas(entityId: number, value: Canvas) {
  DATA[entityId] = value;
}

export function hasCanvas(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getCanvas(entityId: number): Canvas {
  invariant(hasCanvas(entityId), `Entity ${entityId} does not have a Canvas`);
  return DATA[entityId];
}

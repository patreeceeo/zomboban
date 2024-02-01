import { Application } from "pixi.js";
import { invariant } from "../Error";
import { SCREENX_PX, SCREENY_PX } from "../units/convert";
import { HAND_CURSOR_STYLE, HAND_TAP_CURSOR_STYLE } from "../constants";

class State {
  #pixiApp?: Application;
  get pixiApp() {
    invariant(this.#pixiApp !== undefined, "pixiApp is not initialized");
    return this.#pixiApp!;
  }

  mountPixiApp(parent: HTMLElement) {
    const app = (this.#pixiApp = new Application({
      width: SCREENX_PX,
      height: SCREENY_PX,
    }));

    parent.appendChild(app.view as any);
    const { cursorStyles } = app.renderer.events;
    cursorStyles.default = HAND_CURSOR_STYLE;
    cursorStyles.pointer = HAND_CURSOR_STYLE;
    cursorStyles.tap = HAND_TAP_CURSOR_STYLE;

    addEventListener("mousedown", () => {
      app.renderer.events.setCursor("tap");
    });
    addEventListener("keydown", () => {
      app.renderer.events.setCursor("none");
    });
  }
}

export const state = new State();

import { WebGLRenderer } from "three";
import { System } from "../System";
import { SpriteComponent2 } from "../components";
import { State } from "../state";
import { SCREENX_PX, SCREENY_PX } from "../units/convert";
import { IObservableSubscription } from "../Observable";

export function createRenderer() {
  const parentEl = document.getElementById("game")!;
  const renderer = new WebGLRenderer();
  renderer.setSize(SCREENX_PX, SCREENY_PX);
  renderer.setPixelRatio(4);
  // We want these to be set with CSS
  Object.assign(renderer.domElement.style, {
    width: "",
    height: ""
  });
  parentEl.appendChild(renderer.domElement);
  return renderer;
}

export class RenderSystem extends System<State> {
  #subscriptions = [] as IObservableSubscription[];
  start(state: State) {
    const spriteQuery = state.query([SpriteComponent2]);
    this.#subscriptions.push(
      spriteQuery.stream((entity) => {
        const { sprite } = entity;
        state.scene.add(sprite);
      }),
      spriteQuery.onRemove((entity) => {
        state.scene.remove(entity.sprite);
      })
    );
  }
  update(state: State) {
    state.renderer.render(state.scene, state.camera);
  }
  stop() {
    for (const sub of this.#subscriptions) {
      sub.unsubscribe();
    }
  }
}

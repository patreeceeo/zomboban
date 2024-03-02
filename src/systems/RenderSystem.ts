import { WebGLRenderer } from "three";
import { System } from "../System";
import { SpriteComponent2 } from "../components";
import { SPRITE_HEIGHT, SPRITE_WIDTH } from "../constants";
import { State } from "../state";
import { SCREENX_PX, SCREENY_PX } from "../units/convert";

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
  start(state: State) {
    // TODO add a way to remove these callbacks?
    // or use the reference equality of the callback to
    // ensure that we don't add the same callback twice
    SpriteComponent2.entities.stream((entity) => {
      const { sprite, textureId } = entity;
      sprite.material.map = state.getTexture(textureId);
      sprite.scale.set(SPRITE_WIDTH, SPRITE_HEIGHT, 1);
      state.scene.add(sprite);
    });

    SpriteComponent2.entities.onRemove((entity) => {
      state.scene.remove(entity.sprite);
    });
  }
  update(state: State) {
    state.renderer.render(state.scene, state.camera);
  }
}

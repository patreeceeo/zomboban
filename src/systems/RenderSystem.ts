import { SPRITE_HEIGHT, SPRITE_WIDTH } from "../constants";
import { state } from "../newState";

state.sprites.stream((entity) => {
  const { sprite, textureId } = entity;
  sprite.material.map = state.getTexture(textureId);
  sprite.scale.set(SPRITE_WIDTH, SPRITE_HEIGHT, 1);
  state.scene.add(sprite);
});

state.sprites.onRemove((entity) => {
  state.scene.remove(entity.sprite);
});

export function RenderSystem() {
  state.renderer.render(state.scene, state.camera);
}

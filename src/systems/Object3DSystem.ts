import {
  LayerIdComponent,
  SpriteComponent,
  TextureComponent,
  TextureIdComponent,
} from "../components";
import {
  EntityFrameOperation,
  EntityFrameOperationComponent,
} from "../components/EntityFrameOperation";
import { LayerId } from "../components/LayerId";
import { SPRITE_HEIGHT, SPRITE_WIDTH } from "../constants";
import { state } from "../state";
import { DoubleSide } from "three";

const NewSpritesQuery = state
  .buildQuery({
    all: [SpriteComponent],
  })
  .complete();

const SpritesBeingRemovedQuery = state
  .buildQuery({
    all: [SpriteComponent, EntityFrameOperationComponent],
  })
  .complete(({ entityId }) => {
    return (
      state.get(EntityFrameOperationComponent, entityId) ===
      EntityFrameOperation.REMOVE
    );
  });

export function Object3DSystem() {
  for (const entityId of NewSpritesQuery()) {
    // TODO shouldn't most of this be done in component event listeners?
    // TODO this is running every frame
    const textureId = state.get(TextureIdComponent, entityId);
    const texture = state.get(TextureComponent, textureId);
    const sprite = state.get(SpriteComponent, entityId);
    sprite.material.map = texture;
    sprite.material.side = DoubleSide;
    sprite.scale.set(SPRITE_WIDTH, SPRITE_HEIGHT, 1);
    if (state.is(LayerIdComponent, entityId, LayerId.UI)) {
      // render above everything regardless of its position in the scene
      sprite.renderOrder = 999;
      sprite.material.depthTest = false;
      sprite.material.depthWrite = false;
    }
    state.scene.add(sprite);
  }

  for (const entityId of SpritesBeingRemovedQuery()) {
    const sprite = state.get(SpriteComponent, entityId);
    state.scene.remove(sprite);
  }

  state.renderer.render(state.scene, state.camera);
}

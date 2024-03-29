import { NearestFilter, Texture } from "three";
import { SystemWithQueries } from "../System";
import { SpriteComponent } from "../components";
import { invariant } from "../Error";
import { Image } from "../globals";
import { EntityWithComponents } from "../Component";
import { QueryState, TextureCacheState } from "../state";

type State = QueryState & TextureCacheState;

export class AnimationSystem extends SystemWithQueries<State> {
  spritesQuery = this.createQuery([SpriteComponent]);
  start(context: State): void {
    super.start(context);
    const resource = this.spritesQuery.stream((entity) => {
      const { animation } = entity;
      for (const [clipIndex, clip] of animation.clips.entries()) {
        for (const track of clip.tracks) {
          for (const textureId of track.values) {
            invariant(
              typeof textureId === "string",
              `expected string, got ${textureId}`
            );
            if (!context.hasTexture(textureId)) {
              const texture = new Texture();
              texture.magFilter = NearestFilter;
              texture.minFilter = NearestFilter;
              texture.image = new Image();
              texture.image.src = textureId;
              texture.image.onload = () => {
                texture.needsUpdate = true;
                if (clipIndex === animation.clipIndex) {
                  this.setSpriteScale(entity);
                }
              };
              context.addTexture(textureId, texture);
            }
          }
        }
      }

      this.updateTexture(entity, context);
    });

    this.resources.push(resource);
  }
  update(context: State): void {
    for (const entity of this.spritesQuery) {
      this.updateTexture(entity, context);
    }
  }
  updateTexture(
    entity: EntityWithComponents<typeof SpriteComponent>,
    context: State
  ): void {
    const { animation, object } = entity;
    const textureId = animation.clips[animation.clipIndex].tracks[0]
      .values[0] as unknown as string;
    const texture = context.getTexture(textureId);
    if (texture !== object.material.map) {
      object.material.map = texture;
      this.setSpriteScale(entity);
    }
  }
  setSpriteScale = (entity: EntityWithComponents<typeof SpriteComponent>) => {
    const { object } = entity;
    const { image } = object.material.map as {
      image: HTMLImageElement;
    };
    object.scale.set(image.naturalWidth, image.naturalHeight, 1);
  };
}

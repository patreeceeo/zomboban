import { NearestFilter, Texture } from "three";
import { IObservableSubscription } from "../Observable";
import { SystemWithQueries } from "../System";
import { SpriteComponent2 } from "../components";
import { invariant } from "../Error";
import { Image } from "../globals";
import { IQueryResults } from "../Query";
import { EntityWithComponents } from "../Component";
import { QueryState, TextureCacheState } from "../state";

type State = QueryState & TextureCacheState;

export class AnimationSystem extends SystemWithQueries<State> {
  #subscriptions = [] as IObservableSubscription[];
  queryDefMap = {
    spritesQuery: { components: [SpriteComponent2] }
  };
  declare spritesQuery: IQueryResults<typeof SpriteComponent2>;
  start(context: State): void {
    super.start(context);
    this.#subscriptions.push(
      this.spritesQuery.stream((entity) => {
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
      })
    );
  }
  update(context: State): void {
    for (const entity of this.spritesQuery) {
      this.updateTexture(entity, context);
    }
  }
  updateTexture(
    entity: EntityWithComponents<typeof SpriteComponent2>,
    context: State
  ): void {
    const { animation, sprite } = entity;
    const textureId = animation.clips[animation.clipIndex].tracks[0]
      .values[0] as unknown as string;
    const texture = context.getTexture(textureId);
    if (texture !== sprite.material.map) {
      sprite.material.map = texture;
      this.setSpriteScale(entity);
    }
  }
  setSpriteScale = (entity: EntityWithComponents<typeof SpriteComponent2>) => {
    const { sprite } = entity;
    const { image } = sprite.material.map as {
      image: HTMLImageElement;
    };
    sprite.scale.set(image.naturalWidth, image.naturalHeight, 1);
  };
  stop(): void {
    for (const sub of this.#subscriptions) {
      sub.unsubscribe();
    }
  }
}

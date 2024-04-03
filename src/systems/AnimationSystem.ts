import { NearestFilter, Sprite, Texture } from "three";
import { SystemWithQueries } from "../System";
import { invariant } from "../Error";
import { Image } from "../globals";
import { EntityWithComponents } from "../Component";
import { QueryState, TextureCacheState } from "../state";
import {
  AnimationComponent,
  ModelComponent,
  TransformComponent
} from "../components";
import { Not } from "../Query";

type State = QueryState & TextureCacheState;
type Entity = EntityWithComponents<
  typeof AnimationComponent | typeof TransformComponent
>;

export function getSprite(entity: Entity): Sprite {
  return entity.transform.children[0] as Sprite;
}

export class AnimationSystem extends SystemWithQueries<State> {
  spritesQuery = this.createQuery([
    TransformComponent,
    AnimationComponent,
    Not(ModelComponent)
  ]);
  start(context: State): void {
    this.resources.push(
      this.spritesQuery.stream((entity) => {
        if (getSprite(entity) === undefined) {
          const sprite = new Sprite();
          entity.transform.add(sprite);
        }
        this.loadSpriteAnimations(context, entity);
        this.updateTexture(entity, context);
      })
    );
  }
  update(context: State): void {
    for (const entity of this.spritesQuery) {
      this.updateTexture(entity, context);
    }
  }
  loadSpriteAnimations(context: State, entity: Entity) {
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
  }
  updateTexture(entity: Entity, context: State): void {
    const { animation } = entity;
    const tracks = animation.clips[animation.clipIndex].tracks;
    if (tracks.length === 0) {
      return;
    }
    const textureId = tracks[0].values[0] as unknown as string;
    const texture = context.getTexture(textureId);
    const sprite = getSprite(entity);
    if (texture !== sprite.material.map) {
      sprite.material.map = texture;
      this.setSpriteScale(entity);
    }
  }
  setSpriteScale = (entity: Entity) => {
    const { transform } = entity;
    const { image } = getSprite(entity).material.map as {
      image: HTMLImageElement;
    };
    transform.scale.set(image.naturalWidth, image.naturalHeight, 1);
  };
}

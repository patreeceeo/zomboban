import { Texture } from "three";
import { IObservableSubscription } from "../Observable";
import { System } from "../System";
import { SpriteComponent2 } from "../components";
import { State } from "../state";
import { invariant } from "../Error";
import { Image } from "../globals";

export class AnimatedTextureLoaderSystem extends System<State> {
  #subscriptions = [] as IObservableSubscription[];
  start(context: State): void {
    this.#subscriptions.push(
      context.query([SpriteComponent2]).stream((entity) => {
        const { animations, playingAnimationIndex } = entity;
        for (const animation of animations) {
          for (const track of animation.tracks) {
            for (const textureId of track.values) {
              invariant(
                typeof textureId === "string",
                `expected string, got ${textureId}`
              );
              if (!context.hasTexture(textureId)) {
                const texture = new Texture();
                texture.image = new Image();
                texture.image.src = textureId;
                texture.image.onload = () => {
                  texture.needsUpdate = true;
                };
                context.addTexture(textureId, texture);
              }
            }
          }
        }
        entity.sprite.material.map = context.getTexture(
          animations[playingAnimationIndex].tracks[0].values[0]
        );
      })
    );
  }
  stop(): void {
    for (const sub of this.#subscriptions) {
      sub.unsubscribe();
    }
  }
}

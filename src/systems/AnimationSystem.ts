import { SystemWithQueries } from "../System";
import { EntityWithComponents } from "../Component";
import { State } from "../state";
import {
  AnimationComponent,
  ModelComponent,
  SpriteComponent,
  TransformComponent
} from "../components";
import { Not } from "../Query";
import { LogLevel } from "../Log";
import { Sprite } from "../Sprite";
import {invariant} from "../Error";
import {joinPath} from "../util";
import {BASE_URL} from "../constants";
import {LoadingItem} from "./LoadingSystem";

type Entity = EntityWithComponents<
  typeof SpriteComponent | typeof AnimationComponent
>;

export class AnimationSystem extends SystemWithQueries<State> {
  preSpritesQuery = this.createQuery([
    TransformComponent,
    AnimationComponent,
    Not(ModelComponent, this.mgr.context.world)
  ]);
  spritesQuery = this.createQuery([AnimationComponent, SpriteComponent]);
  start(): void {
    this.resources.push(
      this.preSpritesQuery.stream((entity) => {
        if (!SpriteComponent.has(entity)) {
          SpriteComponent.add(entity);
          entity.sprite = new Sprite(entity.transform);
        }
      })
    );
  }
  update(context: State): void {
    for (const entity of this.spritesQuery) {
      this.updateTexture(entity, context);
    }
  }
  updateTexture(entity: Entity, context: State): void {
    const { animation } = entity;
    const tracks = animation.clips[animation.clipIndex].tracks;
    if (tracks.length === 0) {
      this.log(
        `Failed to update texture for sprite: No animation tracks found for clip ${animation.clipIndex}`,
        LogLevel.Warning
      );
      return;
    }
    const textureId = tracks[0].values[0] as unknown as string;
    if (context.texture.has(textureId)) {
      const texture = context.texture.get(textureId);
      invariant(texture !== undefined, `Texture ${textureId} not found`);
      const { sprite } = entity;
      sprite.texture = texture;
    } else {
      const item = new LoadingItem(`texture ${textureId}`, async () => { await context.texture.load(textureId, joinPath(BASE_URL, textureId))})
      context.loadingItems.add(item);
    }
  }
}

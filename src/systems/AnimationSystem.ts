import { SystemWithQueries } from "../System";
import { EntityWithComponents } from "../Component";
import { State } from "../state";
import {
  AnimationComponent,
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
import {RhythmType} from "../Rhythm";

type Entity = EntityWithComponents<
  typeof SpriteComponent | typeof AnimationComponent
>;

export class AnimationSystem extends SystemWithQueries<State> {
  rhythmType = RhythmType.Frame;
  preSpritesQuery = this.createQuery([
    TransformComponent,
    AnimationComponent,
    Not(SpriteComponent, this.mgr.context.world)
  ]);
  spritesQuery = this.createQuery([AnimationComponent, SpriteComponent]);
  start(): void {
    this.resources.push(
      this.preSpritesQuery.stream((entity) => {
        SpriteComponent.add(entity);
        entity.sprite = new Sprite(entity.transform);
      })
    );
  }
  
  update(context: State): void {
    // Check for animation changes on all sprite entities
    for (const entity of this.spritesQuery) {
      this.updateTexture(entity, context);
    }
  }
  async updateTexture(entity: Entity, context: State): Promise<void> {
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
      entity.sprite.texture = texture;

    } else {
      const item = new LoadingItem(`texture ${textureId}`, async () => {
        const texture = await context.texture.load(textureId, joinPath(BASE_URL, textureId))
        entity.sprite.texture = texture;
      })
      context.loadingItems.add(item);
    }
  }
}

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

type AnimationState = State;
type Entity = EntityWithComponents<
  typeof SpriteComponent | typeof AnimationComponent
>;

export class AnimationSystem extends SystemWithQueries<AnimationState> {
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
  update(context: AnimationState): void {
    for (const entity of this.spritesQuery) {
      this.updateTexture(entity, context);
    }
  }
  updateTexture(entity: Entity, context: AnimationState): void {
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
    if (context.hasTexture(textureId)) {
      const texture = context.getTexture(textureId);
      const { sprite } = entity;
      sprite.texture = texture;
    }
  }
}

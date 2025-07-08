import {
  CursorTag,
  IsActiveTag,
  IsGameEntityTag,
  TransformComponent
} from "../components";
import { EntityManagerState } from "../state";
import { SystemWithQueries } from "../System";

export class GameSystem extends SystemWithQueries<EntityManagerState> {
  #gameEntities = this.createQuery([IsGameEntityTag]);
  #cursorNtts = this.createQuery([CursorTag, TransformComponent]);
  start() {
    this.#gameEntities.stream((entity) => IsActiveTag.add(entity));
    this.#gameEntities.onRemove((entity) => IsActiveTag.remove(entity));
    for (const entity of this.#cursorNtts) {
      IsActiveTag.remove(entity);
      entity.transform.visible = false;
    }
  }
  stop() {
    for (const entity of this.#gameEntities!) {
      IsActiveTag.remove(entity);
    }
  }
}

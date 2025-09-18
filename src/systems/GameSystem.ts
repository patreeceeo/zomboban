import {
  IsActiveTag,
  IsGameEntityTag
} from "../components";
import { State } from "../state";
import { SystemWithQueries } from "../System";

export class GameSystem extends SystemWithQueries<State> {
  #gameEntities = this.createQuery([IsGameEntityTag]);
  start(state: State) {
    this.#gameEntities.stream((entity) => IsActiveTag.add(entity));
    this.#gameEntities.onRemove((entity) => IsActiveTag.remove(entity));
    for (const entity of state.cursorEntities) {
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

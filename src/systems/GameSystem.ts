import { IsActiveTag, IsGameEntityTag } from "../components";
import { QueryState } from "../state";
import { SystemWithQueries } from "../System";

export class GameSystem extends SystemWithQueries<QueryState> {
  #gameEntities = this.createQuery([IsGameEntityTag]);
  start() {
    for (const entity of this.#gameEntities) {
      IsActiveTag.add(entity);
    }
  }
  stop() {
    for (const entity of this.#gameEntities!) {
      IsActiveTag.remove(entity);
    }
  }
}

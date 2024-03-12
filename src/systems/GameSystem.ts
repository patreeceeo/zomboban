import { IsActiveTag, IsGameEntityTag } from "../components";
import { IQueryResults } from "../Query";
import { QueryState } from "../state";
import { System } from "../System";

export class GameSystem extends System<QueryState> {
  #gameEntities: IQueryResults<any> | undefined;
  start(state: QueryState) {
    this.#gameEntities = state.query([IsGameEntityTag]);
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

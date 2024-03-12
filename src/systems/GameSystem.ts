import { IsActiveTag, IsGameEntityTag } from "../components";
import { IQueryResults } from "../Query";
import { State } from "../state";
import { System } from "../System";

export class GameSystem extends System<State> {
  #gameEntities: IQueryResults<any> | undefined;
  start(state: State) {
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

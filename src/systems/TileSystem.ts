import { IQueryResults } from "../Query";
import { System } from "../System";
import { IsActiveTag, SpriteComponent2 } from "../components";
import { State } from "../state";
import { convertToTiles } from "../units/convert";

export class TileSystem extends System<State> {
  #query: IQueryResults<typeof SpriteComponent2> | undefined;
  start(state: State): void {
    this.#query = state.query([SpriteComponent2, IsActiveTag]);
  }
  update(state: State): void {
    state.tiles.clear();
    for (const entity of this.#query!) {
      const { position } = entity;
      state.tiles.set(
        convertToTiles(position.x),
        convertToTiles(position.y),
        entity
      );
    }
  }
}

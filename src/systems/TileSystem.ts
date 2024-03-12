import { Vector3 } from "three";
import { IQueryResults } from "../Query";
import { System } from "../System";
import { IsActiveTag, SpriteComponent2 } from "../components";
import { State } from "../state";
import { convertToTiles } from "../units/convert";

function placeEntityOnTile(state: State, entity: { position: Vector3 }) {
  const { position } = entity;
  const tileX = convertToTiles(position.x);
  const tileY = convertToTiles(position.y);
  const set = state.tiles.get(tileX, tileY) || [];
  set.push(entity);
  state.tiles.set(tileX, tileY, set);
}

export class TileSystem extends System<State> {
  #query: IQueryResults<typeof SpriteComponent2> | undefined;
  start(state: State): void {
    this.#query = state.query([SpriteComponent2, IsActiveTag]);
  }
  update(state: State): void {
    // only update tile matrix when we've finished processing all actions
    if (state.actions.length === state.actionPointer) {
      state.tiles.clear();
      for (const entity of this.#query!) {
        placeEntityOnTile(state, entity);
      }
    }
  }
}

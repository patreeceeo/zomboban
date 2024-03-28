import { Vector3 } from "three";
import { IQueryResults } from "../Query";
import { SystemWithQueries } from "../System";
import { AddedTag, IsGameEntityTag, SpriteComponent } from "../components";
import { convertToTiles } from "../units/convert";
import { ActionsState, QueryState, TilesState } from "../state";

function placeEntityOnTile(
  tiles: TilesState["tiles"],
  entity: { position: Vector3 }
) {
  const { position } = entity;
  const tileX = convertToTiles(position.x);
  const tileY = convertToTiles(position.y);
  const set = tiles.get(tileX, tileY) || [];
  set.push(entity);
  tiles.set(tileX, tileY, set);
}

function updateTiles(
  tiles: TilesState["tiles"],
  query: IQueryResults<typeof SpriteComponent>
) {
  tiles.clear();
  for (const entity of query) {
    placeEntityOnTile(tiles, entity);
  }
}

type Context = TilesState & QueryState & ActionsState;

export class TileSystem extends SystemWithQueries<Context> {
  #query = this.createQuery([SpriteComponent, AddedTag, IsGameEntityTag]);
  start(state: Context): void {
    this.resources.push(
      state.completedActions.onAdd(() =>
        updateTiles(state.tiles, this.#query!)
      ),
      state.completedActions.onRemove(() =>
        updateTiles(state.tiles, this.#query!)
      ),
      this.#query.onAdd((entity) => placeEntityOnTile(state.tiles, entity)),
      this.#query.onRemove(() => {
        updateTiles(state.tiles, this.#query!);
      })
    );
  }
}

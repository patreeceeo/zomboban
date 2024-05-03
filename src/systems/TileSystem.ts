import { IQueryResults } from "../Query";
import { SystemWithQueries } from "../System";
import {
  AddedTag,
  ChangedTag,
  IsGameEntityTag,
  TransformComponent
} from "../components";
import { convertToTiles } from "../units/convert";
import { ActionsState, QueryState, TilesState } from "../state";
import { EntityWithComponents } from "../Component";

function placeEntityOnTile(
  tiles: TilesState["tiles"],
  entity: EntityWithComponents<typeof TransformComponent>
) {
  const { position } = entity.transform;
  const tileX = convertToTiles(position.x);
  const tileY = convertToTiles(position.y);
  const set = tiles.get(tileX, tileY) || [];
  set.push(entity);
  tiles.set(tileX, tileY, set);
}

function updateTiles(
  tiles: TilesState["tiles"],
  query: IQueryResults<[typeof TransformComponent]>
) {
  tiles.clear();
  for (const entity of query) {
    placeEntityOnTile(tiles, entity);
  }
}

type Context = TilesState & QueryState & ActionsState;

export class TileSystem extends SystemWithQueries<Context> {
  #tileQuery = this.createQuery([
    TransformComponent,
    AddedTag,
    IsGameEntityTag
  ]);
  // TODO(perf): this query should be more specific?
  #changedQuery = this.createQuery([ChangedTag]);
  start(state: Context): void {
    this.resources.push(
      this.#changedQuery.onAdd(() => {
        updateTiles(state.tiles, this.#tileQuery);
      }),
      this.#tileQuery.onAdd((entity) => placeEntityOnTile(state.tiles, entity)),
      this.#tileQuery.onRemove(() => {
        updateTiles(state.tiles, this.#tileQuery);
      })
    );
  }
}

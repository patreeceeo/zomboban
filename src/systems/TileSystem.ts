import { IQueryResults } from "../Query";
import { SystemWithQueries } from "../System";
import {
  AddedTag,
  ChangedTag,
  IsGameEntityTag,
  TransformComponent
} from "../components";
import { convertToTilesMax, convertToTilesMin } from "../units/convert";
import { ActionsState, QueryState, TilesState } from "../state";
import { EntityWithComponents } from "../Component";

function placeEntityOnTile(
  tiles: TilesState["tiles"],
  entity: EntityWithComponents<typeof TransformComponent>,
  tileX: number,
  tileY: number
) {
  const set = tiles.get(tileX, tileY) || [];
  set.push(entity);
  tiles.set(tileX, tileY, set);
}

function placeEntityOnTiles(
  tiles: TilesState["tiles"],
  entity: EntityWithComponents<typeof TransformComponent>
) {
  const { position } = entity.transform;
  const tileXMax = convertToTilesMax(position.x);
  const tileXMin = convertToTilesMin(position.x);
  const tileYMax = convertToTilesMax(position.y);
  const tileYMin = convertToTilesMin(position.y);
  placeEntityOnTile(tiles, entity, tileXMin, tileYMin);
  placeEntityOnTile(tiles, entity, tileXMax, tileYMin);
  placeEntityOnTile(tiles, entity, tileXMin, tileYMax);
  placeEntityOnTile(tiles, entity, tileXMax, tileYMax);
}

function updateTiles(
  tiles: TilesState["tiles"],
  query: IQueryResults<[typeof TransformComponent]>
) {
  tiles.clear();
  for (const entity of query) {
    placeEntityOnTiles(tiles, entity);
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
    updateTiles(state.tiles, this.#tileQuery);
    this.resources.push(
      this.#changedQuery.onAdd(() => {
        updateTiles(state.tiles, this.#tileQuery);
      }),
      this.#tileQuery.onAdd((entity) =>
        placeEntityOnTiles(state.tiles, entity)
      ),
      this.#tileQuery.onRemove(() => {
        updateTiles(state.tiles, this.#tileQuery);
      })
    );
  }
}

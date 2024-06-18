import { IQueryResults } from "../Query";
import { SystemWithQueries } from "../System";
import {
  AddedTag,
  ChangedTag,
  IsGameEntityTag,
  TransformComponent,
  VelocityComponent
} from "../components";
import { convertToTilesMax, convertToTilesMin } from "../units/convert";
import { ActionsState, QueryState, TilesState, TimeState } from "../state";
import { EntityWithComponents } from "../Component";
import { Vector2 } from "three";

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

const _tileCoords = new Vector2();
function* getWholeNumberPointsInRectangle(
  xMin: number,
  yMin: number,
  xMax: number,
  yMax: number
) {
  for (let x = xMin; x <= xMax; x++) {
    for (let y = yMin; y <= yMax; y++) {
      _tileCoords.set(x, y);
      yield _tileCoords;
    }
  }
}

function placeEntityOnTiles(
  tiles: TilesState["tiles"],
  entity: EntityWithComponents<typeof TransformComponent>,
  deltaTime: number
) {
  const { transform } = entity;
  const { x, y } = transform.position;
  let dx2 = 0,
    dy2 = 0;
  if (VelocityComponent.has(entity)) {
    const { velocity } = entity;
    (dx2 = velocity.x * deltaTime), (dy2 = velocity.y * deltaTime);
  }
  const tileXMax = convertToTilesMax(x + dx2);
  const tileXMin = convertToTilesMin(x);
  const tileYMax = convertToTilesMax(y + dy2);
  const tileYMin = convertToTilesMin(y);

  for (const tile of getWholeNumberPointsInRectangle(
    tileXMin,
    tileYMin,
    tileXMax,
    tileYMax
  )) {
    placeEntityOnTile(tiles, entity, tile.x, tile.y);
  }
}

function updateTiles(
  tiles: TilesState["tiles"],
  query: IQueryResults<[typeof TransformComponent]>,
  deltaTime: number
) {
  tiles.clear();
  for (const entity of query) {
    placeEntityOnTiles(tiles, entity, deltaTime);
  }
}

type Context = TilesState & QueryState & ActionsState & TimeState;

export class TileSystem extends SystemWithQueries<Context> {
  #tileQuery = this.createQuery([
    TransformComponent,
    AddedTag,
    IsGameEntityTag
  ]);
  // TODO(perf): this query should be more specific?
  #changedQuery = this.createQuery([
    ChangedTag,
    TransformComponent,
    VelocityComponent
  ]);
  start(state: Context): void {
    updateTiles(state.tiles, this.#tileQuery, state.dt);
    this.resources.push(
      this.#changedQuery.onAdd(() => {
        updateTiles(state.tiles, this.#tileQuery, state.dt);
      }),
      this.#tileQuery.onAdd((entity) =>
        placeEntityOnTiles(state.tiles, entity, state.dt)
      ),
      this.#tileQuery.onRemove(() => {
        updateTiles(state.tiles, this.#tileQuery, state.dt);
      })
    );
  }
}

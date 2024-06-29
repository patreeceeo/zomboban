import { IQueryResults } from "../Query";
import { SystemWithQueries } from "../System";
import {
  AddedTag,
  ChangedTag,
  IsGameEntityTag,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { convertToTiles } from "../units/convert";
import { ActionsState, QueryState, TilesState, TimeState } from "../state";
import { EntityWithComponents } from "../Component";

type TileEntityComponents =
  | typeof TilePositionComponent
  | typeof TransformComponent;
export type TileEntity = EntityWithComponents<TileEntityComponents>;

function moveEntityToTile(tiles: TilesState["tiles"], entity: TileEntity) {
  const { tilePosition, transform } = entity;
  const tileXOld = tilePosition.x;
  const tileYOld = tilePosition.y;
  const { x, y } = transform.position;
  const tileX = convertToTiles(x);
  const tileY = convertToTiles(y);
  if (tiles.get(tileXOld, tileYOld) === entity) {
    tiles.delete(tileXOld, tileYOld);
  }
  tiles.set(tileX, tileY, entity);
  entity.tilePosition.set(tileX, tileY, 0);
  // console.log(
  //   "tile position for",
  //   entity.behaviorId,
  //   entity.tilePosition.toArray()
  // );
}

function updateTiles(
  tiles: TilesState["tiles"],
  query: IQueryResults<[TileEntityComponents]>
) {
  for (const entity of query) {
    moveEntityToTile(tiles, entity);
  }
}

type Context = TilesState & QueryState & ActionsState & TimeState;

// TODO unit test this
export class TileSystem extends SystemWithQueries<Context> {
  #tileQuery = this.createQuery([
    TilePositionComponent,
    TransformComponent,
    AddedTag,
    IsGameEntityTag
  ]);
  // TODO(perf): this query should be more specific?
  #changedQuery = this.createQuery([
    ChangedTag,
    TransformComponent,
    TilePositionComponent
  ]);
  start(state: Context): void {
    updateTiles(state.tiles, this.#tileQuery);
    this.resources.push(
      this.#changedQuery.onAdd(() => {
        updateTiles(state.tiles, this.#changedQuery);
      }),
      this.#tileQuery.onAdd((entity) => moveEntityToTile(state.tiles, entity)),
      this.#tileQuery.onRemove(() => {
        updateTiles(state.tiles, this.#tileQuery);
      })
    );
  }
}

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
import { ActionsState, QueryState, TimeState } from "../state";
import { EntityWithComponents } from "../Component";
import { MatrixOfIterables } from "../Matrix";

type TileEntityComponents =
  | typeof TilePositionComponent
  | typeof TransformComponent;
export type TileEntity = EntityWithComponents<TileEntityComponents>;

type Context = ITilesState & QueryState & ActionsState & TimeState;

export type TileMatrix = MatrixOfIterables<TileEntity>;

export interface ITilesState {
  tiles: TileMatrix;
}

// function stringifyTileCoords(x: number, y: number, z: number) {
//   return `(${x}, ${y}, ${z})`;
// }

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
    TilePositionComponent,
    AddedTag
  ]);
  start(state: Context): void {
    this.updateTiles(state.tiles, this.#tileQuery);
    this.resources.push(
      this.#changedQuery.onAdd((entity) => {
        this.moveEntityToTile(state.tiles, entity);
      }),
      this.#tileQuery.onAdd((entity) => {
        this.moveEntityToTile(state.tiles, entity);
      }),
      this.#tileQuery.onRemove((entity) => {
        this.removeEntityFromTile(state.tiles, entity);
      })
    );
  }
  moveEntityToTile(tiles: TileMatrix, entity: TileEntity) {
    const { x, y, z } = entity.tilePosition;
    if (tiles.hasItem(x, y, z, entity)) {
      this.removeEntityFromTile(tiles, entity);
    }
    this.placeEntityOnTile(tiles, entity);
    // this.log(
    //   `moved entity from ${stringifyTileCoords(tileXOld, tileYOld, tileZOld)} to ${stringifyTileCoords(tileX, tileY, tileZ)}`
    // );
  }
  placeEntityOnTile(tiles: TileMatrix, entity: TileEntity) {
    const { x, y, z } = entity.transform.position;
    const tileX = convertToTiles(x);
    const tileY = convertToTiles(y);
    const tileZ = convertToTiles(z);
    tiles.add(tileX, tileY, tileZ, entity);
    entity.tilePosition.set(tileX, tileY, tileZ);
  }
  removeEntityFromTile(tiles: TileMatrix, entity: TileEntity) {
    const { x, y, z } = entity.tilePosition;
    tiles.subtract(x, y, z, entity);
    // this.log(`removed entity from ${stringifyTileCoords(x, y, z)}`);
  }
  updateTiles(tiles: TileMatrix, query: IQueryResults<[TileEntityComponents]>) {
    for (const entity of query) {
      this.moveEntityToTile(tiles, entity);
    }
  }
}

import { IQueryResults } from "../Query";
import { SystemWithQueries } from "../System";
import {
  InSceneTag,
  ChangedTag,
  IsGameEntityTag,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { convertToTiles } from "../units/convert";
import { ActionsState, QueryState, TimeState } from "../state";
import { EntityWithComponents } from "../Component";
import { Matrix } from "../Matrix";

type TileEntityComponents =
  | typeof TilePositionComponent
  | typeof TransformComponent;
export type TileEntity = EntityWithComponents<TileEntityComponents>;

class TileData {
  ents = new Set<TileEntity>();
  constructor() {}
}

export class TileMatrix extends Matrix<TileData> {
  #emptySet = new Set();
  getEnts(x: number, y: number, z: number): ReadonlySet<TileEntity> {
    if (this.has(x, y, z)) {
      return this.get(x, y, z)!.ents;
    }
    return this.#emptySet as Set<TileEntity>;
  }
  createTileData() {
    return new TileData();
  }
  addEnts(x: number, y: number, z: number, ...ents: TileEntity[]): void {
    const data = this.get(x, y, z) || this.createTileData();
    for (const ent of ents) {
      data.ents.add(ent);
      ent.tilePosition.set(x, y, z);
    }
    this.set(x, y, z, data);
  }
  deleteEnts(x: number, y: number, z: number, ...ents: TileEntity[]): void {
    if (this.has(x, y, z)) {
      const data = this.get(x, y, z)!;
      for (const ent of ents) {
        data.ents.delete(ent);
      }
    }
  }
}

type Context = ITilesState & QueryState & ActionsState & TimeState;

// export type TileMatrix = Matrix<TileData>;

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
    InSceneTag,
    IsGameEntityTag
  ]);
  // TODO(perf): this query should be more specific?
  #changedQuery = this.createQuery([
    ChangedTag,
    TransformComponent,
    TilePositionComponent,
    InSceneTag
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
    if (tiles.get(x, y, z)) {
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
    tiles.addEnts(tileX, tileY, tileZ, entity);
  }
  removeEntityFromTile(tiles: TileMatrix, entity: TileEntity) {
    const { x, y, z } = entity.tilePosition;
    tiles.deleteEnts(x, y, z, entity);
    // this.log(`removed entity from ${stringifyTileCoords(x, y, z)}`);
  }
  updateTiles(tiles: TileMatrix, query: IQueryResults<[TileEntityComponents]>) {
    for (const entity of query) {
      this.moveEntityToTile(tiles, entity);
    }
  }
}

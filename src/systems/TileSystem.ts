import { IQueryResults, Not } from "../Query";
import { SystemWithQueries } from "../System";
import {
  InSceneTag,
  PlatformTag,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { convertToTiles } from "../units/convert";
import { QueryState } from "../state";
import { EntityWithComponents } from "../Component";
import { Matrix } from "../Matrix";

type TileEntityComponents =
  | typeof TilePositionComponent
  | typeof TransformComponent;
export type TileEntity = EntityWithComponents<TileEntityComponents>;

class TileData {
  regularNtts = new Set<TileEntity>();
  platformNtt?: TileEntity;
}

const emptySet = new Set<TileEntity>();

export class TileMatrix extends Matrix<TileData> {
  getNtts(target: TileEntity[], x: number, y: number, z: number): Iterable<TileEntity> {
    target.length = 0;
    if (this.has(x, y, z)) {
      const tileData = this.get(x, y, z)!;
      for (const ntt of tileData.regularNtts) {
        target.push(ntt);
      }
      if (tileData.platformNtt) {
        target.push(tileData.platformNtt);
      }
    }
    return target;
  }
  createTileData() {
    return new TileData();
  }
  getRegularNtts(x: number, y: number, z: number): ReadonlySet<TileEntity> {
    const data = this.get(x, y, z);
    return data ? data.regularNtts : emptySet;
  }
  getPlatformNtt(x: number, y: number, z: number): TileEntity | undefined {
    const data = this.get(x, y, z);
    return data ? data.platformNtt : undefined;
  }
  setPlatformNtt(
    x: number,
    y: number,
    z: number,
    ntt: TileEntity
  ): void {
    const data = this.get(x, y, z) || this.createTileData();
    data.platformNtt = ntt;
    ntt.tilePosition.set(x, y, z);
    this.set(x, y, z, data);
  }
  unsetPlatformNtt(
    x: number,
    y: number,
    z: number
  ): void {
    if (this.has(x, y, z)) {
      const data = this.get(x, y, z)!;
      data.platformNtt = undefined;
    }
  }
  setRegularNtt(x: number, y: number, z: number, ntt: TileEntity): void {
    const data = this.get(x, y, z) || this.createTileData();
    data.regularNtts.add(ntt);
    ntt.tilePosition.set(x, y, 0);
    this.set(x, y, z, data);
  }
  unsetRegularNtt(x: number, y: number, z: number, ntt: TileEntity): void {
    if (this.has(x, y, z)) {
      const data = this.get(x, y, z)!;
      data.regularNtts.delete(ntt);
    }
  }
}

type Context = ITilesState & QueryState;

// export type TileMatrix = Matrix<TileData>;

export interface ITilesState {
  tiles: TileMatrix;
}

// function stringifyTileCoords(x: number, y: number, z: number) {
//   return `(${x}, ${y}, ${z})`;
// }

// TODO unit test this
export class TileSystem extends SystemWithQueries<Context> {
  // TODO(perf): this query should be more specific?
  #tileQuery = this.createQuery([
    TransformComponent,
    TilePositionComponent,
    InSceneTag,
    Not(PlatformTag)
  ]);
  #platformTileQuery = this.createQuery([
    TransformComponent,
    TilePositionComponent,
    InSceneTag,
    PlatformTag
  ]);

  /** Set an entity's tile position based on its transform position.
  */
  static syncEntity(
    entity: TileEntity,
  ) {
    const { x, y } = entity.transform.position;
    const tileX = convertToTiles(x);
    const tileY = convertToTiles(y);
    entity.tilePosition.set(tileX, tileY, 0);
  }

  start(state: Context): void {
    this.resources.push(
      this.#tileQuery.onRemove((entity) => {
        this.removeEntityFromTile(state.tiles, entity);
      }),
      this.#platformTileQuery.onRemove((entity) => {
        removePlatformEntityFromTile(state.tiles, entity);
      })
    );
  }
  update(state: Context): void {
    placePlatformEntities(state.tiles, this.#platformTileQuery);
    this.updateTiles(state.tiles, this.#tileQuery);
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
    const { x, y } = entity.transform.position;
    const tileX = convertToTiles(x);
    const tileY = convertToTiles(y);
    tiles.setRegularNtt(tileX, tileY, 0, entity);
  }
  removeEntityFromTile(tiles: TileMatrix, entity: TileEntity) {
    const { x, y } = entity.tilePosition;
    tiles.unsetRegularNtt(x, y, 0, entity);
    // this.log(`removed entity from ${stringifyTileCoords(x, y, z)}`);
  }
  updateTiles(tiles: TileMatrix, query: IQueryResults<[TileEntityComponents]>) {
    for (const entity of query) {
      this.moveEntityToTile(tiles, entity);
    }
  }
}

function placePlatformEntities(
  tiles: TileMatrix,
  query: IQueryResults<[TileEntityComponents]>
) {
  for (const entity of query) {
    const { x, y } = entity.tilePosition;
    tiles.setPlatformNtt(x, y, 0, entity);
  }
}

function removePlatformEntityFromTile(tiles: TileMatrix, entity: TileEntity) {
  const { x, y } = entity.tilePosition;
  tiles.unsetPlatformNtt(x, y, 0);
}


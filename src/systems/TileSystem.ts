import { Vector3 } from "three";
import { IQueryResults } from "../Query";
import { SystemWithQueries } from "../System";
import { AddedTag, IsGameEntityTag, SpriteComponent2 } from "../components";
import { convertToTiles } from "../units/convert";
import { IObservableSubscription } from "../Observable";
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
  query: IQueryResults<typeof SpriteComponent2>
) {
  tiles.clear();
  for (const entity of query) {
    placeEntityOnTile(tiles, entity);
  }
}

type Context = TilesState & QueryState & ActionsState;

export class TileSystem extends SystemWithQueries<Context> {
  #query = this.createQuery([SpriteComponent2, AddedTag, IsGameEntityTag]);
  #subscriptions = [] as IObservableSubscription[];
  start(state: Context): void {
    this.#subscriptions.push(
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
  stop(): void {
    this.#subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

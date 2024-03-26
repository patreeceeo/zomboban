import { Vector3 } from "three";
import { IQueryResults } from "../Query";
import { System } from "../System";
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

export class TileSystem extends System<Context> {
  #query: IQueryResults<typeof SpriteComponent2> | undefined;
  #subscriptions = [] as IObservableSubscription[];
  start(state: Context): void {
    this.#query = state.query([SpriteComponent2, AddedTag, IsGameEntityTag]);
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

import { IEntityPrefab } from "../EntityPrefab";
import { LoadingState } from "../state";
import { LoadingItem } from "../systems/LoadingSystem";

// TODO maybe behaviors can be responsible for serializing and deserializing entities?
// if so, then this whole directory would be unnecessary, and the persistence format could be simpler
export enum EntityPrefabEnum {
  Cursor,
  Block,
  Monster,
  Player,
  Terminal,
  ToggleButton,
  ToggleWall,
  Wall,
  Grass
}

const PREFABS = [
  EntityPrefabEnum.Cursor,
  EntityPrefabEnum.Block,
  EntityPrefabEnum.Monster,
  EntityPrefabEnum.Player,
  EntityPrefabEnum.Terminal,
  EntityPrefabEnum.ToggleButton,
  EntityPrefabEnum.ToggleWall,
  EntityPrefabEnum.Wall,
  EntityPrefabEnum.Grass
];

export interface IEntityPrefabState {
  entityPrefabMap: Map<EntityPrefabEnum, IEntityPrefab<any, any>>;
}

export async function bindEntityPrefabs(
  state: IEntityPrefabState & LoadingState
) {
  const { entityPrefabMap, loadingItems } = state;
  for (const id of PREFABS) {
    if (!state.entityPrefabMap.has(id)) {
      const promise = importPrefab(id);
      loadingItems.add(
        new LoadingItem(`prefab ${id}`, async () => {
          await promise;
        })
      );
      const prefab = await promise;
      entityPrefabMap.set(id, prefab);
    }
  }
}

async function importPrefab(
  id: EntityPrefabEnum
): Promise<IEntityPrefab<any, any>> {
  switch (id) {
    case EntityPrefabEnum.Block:
      return (await import("./BlockEntity")).default;
    case EntityPrefabEnum.Cursor:
      return (await import("./CursorEntity")).default;
    case EntityPrefabEnum.Grass:
      return (await import("./GrassEntity")).default;
    case EntityPrefabEnum.Monster:
      return (await import("./MonsterEntity")).default;
    case EntityPrefabEnum.Player:
      return (await import("./PlayerPrefab")).default;
    case EntityPrefabEnum.Terminal:
      return (await import("./TerminalEntity")).default;
    case EntityPrefabEnum.ToggleButton:
      return (await import("./ToggleButtonEntity")).default;
    case EntityPrefabEnum.ToggleWall:
      return (await import("./ToggleWall")).default;
    case EntityPrefabEnum.Wall:
      return (await import("./WallEntity")).default;
  }
}

// if (import.meta.hot) {
//   import.meta.hot.on("vite:error", (err) => {
//     console.error(err);
//   });
//   import.meta.hot.accept(() => {});
// }

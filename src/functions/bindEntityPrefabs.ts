import { EntityPrefabEnum, IEntityPrefabState } from "../EntityPrefab";
import { BlockEntity } from "../entities/BlockEntity";
import { GrassEntity } from "../entities/GrassEntity";
import { MonsterEntity } from "../entities/MonsterEntity";
import { PlayerEntity } from "../entities/PlayerPrefab";
import { TerminalEntity } from "../entities/TerminalEntity";
import { ToggleButtonEntity } from "../entities/ToggleButtonEntity";
import { ToggleWallEntity } from "../entities/ToggleWall";
import { WallEntity } from "../entities/WallEntity";

export function bindEntityPrefabs(state: IEntityPrefabState) {
  const { entityPrefabMap } = state;
  for (const [key, prefeb] of [
    [EntityPrefabEnum.Block, BlockEntity],
    [EntityPrefabEnum.Monster, MonsterEntity],
    [EntityPrefabEnum.Player, PlayerEntity],
    [EntityPrefabEnum.Terminal, TerminalEntity],
    [EntityPrefabEnum.ToggleButton, ToggleButtonEntity],
    [EntityPrefabEnum.ToggleWall, ToggleWallEntity],
    [EntityPrefabEnum.Wall, WallEntity],
    [EntityPrefabEnum.Grass, GrassEntity]
  ] as const) {
    entityPrefabMap.set(key, prefeb);
  }
}

if (import.meta.hot) {
  import.meta.hot.on("vite:error", (err) => {
    console.error(err);
  });
  import.meta.hot.accept(() => {});
}

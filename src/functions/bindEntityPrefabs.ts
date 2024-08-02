import { IPrefabEntityState, PrefabEntity } from "../entities";
import { BlockEntity } from "../entities/BlockEntity";
import { MonsterEntity } from "../entities/MonsterEntity";
import { PlayerEntity } from "../entities/PlayerPrefab";
import { TerminalEntity } from "../entities/TerminalEntity";
import { ToggleButtonEntity } from "../entities/ToggleButtonEntity";
import { ToggleWallEntity } from "../entities/ToggleWall";
import { WallEntity } from "../entities/WallEntity";

export function bindEntityPrefabs(state: IPrefabEntityState) {
  const { prefabEntityMap } = state;
  for (const [key, prefeb] of [
    [PrefabEntity.Block, BlockEntity],
    [PrefabEntity.Monster, MonsterEntity],
    [PrefabEntity.Player, PlayerEntity],
    [PrefabEntity.Terminal, TerminalEntity],
    [PrefabEntity.ToggleButton, ToggleButtonEntity],
    [PrefabEntity.ToggleWall, ToggleWallEntity],
    [PrefabEntity.Wall, WallEntity]
  ] as const) {
    prefabEntityMap.set(key, prefeb);
  }
}

if (import.meta.hot) {
  import.meta.hot.on("vite:error", (err) => {
    console.error(err);
  });
  import.meta.hot.accept("../entities/TerminalEntity.ts", () => {});
  import.meta.hot.accept(() => {});
}

import { BehaviorState, QueryState } from "../state";
import { MonsterBehavior } from "../entities/MonsterEntity";
import { TerminalBehavior } from "../entities/TerminalEntity";
import { WallBehavior } from "../entities/WallEntity";
import { PlayerBehavior } from "../entities/PlayerPrefab";
import { BlockBehavior } from "../entities/BlockEntity";
import { ToggleButtonBehavior } from "../entities/ToggleButtonEntity";
import { ToggleWallBehavior } from "../entities/ToggleWall";
import { BehaviorComponent, ToggleableComponent } from "../components";
import { GrassBehavior } from "../entities/GrassEntity";

let _state: BehaviorState & QueryState;

export function bindBehaviors(state: BehaviorState & QueryState) {
  const toggleableQuery = state.query([ToggleableComponent, BehaviorComponent]);
  state.addBehavior(PlayerBehavior.id, new PlayerBehavior());
  state.addBehavior(BlockBehavior.id, new BlockBehavior());
  state.addBehavior(MonsterBehavior.id, new MonsterBehavior());
  state.addBehavior(TerminalBehavior.id, new TerminalBehavior());
  state.addBehavior(WallBehavior.id, new WallBehavior());
  state.addBehavior(
    ToggleButtonBehavior.id,
    new ToggleButtonBehavior(toggleableQuery)
  );
  state.addBehavior(ToggleWallBehavior.id, new ToggleWallBehavior());
  state.addBehavior(GrassBehavior.id, new GrassBehavior());
  // TODO add cursor behavior here
  _state = state;
}

if (import.meta.hot) {
  import.meta.hot.on("vite:error", (err) => {
    console.error(err);
  });
  import.meta.hot.accept("../entities/GrassEntity.ts", (newMod) => {
    const { GrassBehavior } = newMod as any;
    _state.addBehavior(GrassBehavior.id, new GrassBehavior());
  });
  import.meta.hot.accept("../entities/TerminalEntity.ts", (newMod) => {
    const { TerminalBehavior } = newMod as any;
    _state.addBehavior(TerminalBehavior.id, new TerminalBehavior());
  });
  import.meta.hot.accept(() => {});
}

import { afterDOMContentLoaded } from "./util";
import {
  addFrameRhythmCallback,
  addSteadyRhythmCallback,
  startFrameRhythms
} from "./Rhythm";
import { State } from "./state";
import { SystemManager } from "./System";
import { createRouterSystem } from "./systems/RouterSystem";
import { DEFAULT_ROUTE, ROUTES } from "./routes";
import { PlayerBehavior } from "./entities/PlayerPrefab";
import { BlockBehavior } from "./entities/BlockEntity";

afterDOMContentLoaded(function handleDomLoaded() {
  const state = new State();

  const systemMgr = new SystemManager();

  systemMgr.push(createRouterSystem(ROUTES, DEFAULT_ROUTE), state);

  state.addBehavior(PlayerBehavior.id, new PlayerBehavior());
  state.addBehavior(BlockBehavior.id, new BlockBehavior());

  addSteadyRhythmCallback(100, () => systemMgr.updateServices(state));
  addFrameRhythmCallback((dt, time) => {
    if (!isNaN(dt)) {
      state.dt += dt;
    }
    state.time = time;
    systemMgr.update(state);
    state.dt = 0;
  });
  startFrameRhythms();
});

// if (import.meta.hot) {
//   import.meta.hot.on("vite:error", (err) => {
//     console.error(err);
//   });
//   import.meta.hot.dispose(() => {
//     import.meta.hot!.data.loaded = true;
//   });
//   import.meta.hot.accept(() => {});
//   if (!import.meta.hot!.data.loaded) {
//     addEventListers();
//   }
// } else {
//   addEventListers();
// }

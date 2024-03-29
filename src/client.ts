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
import { AddedTag, MeshComponent } from "./components";
import { DirectionalLight, SphereGeometry } from "three";

afterDOMContentLoaded(function handleDomLoaded() {
  const state = new State();

  const systemMgr = new SystemManager(state);

  systemMgr.push(createRouterSystem(ROUTES, DEFAULT_ROUTE));

  state.addBehavior(PlayerBehavior.id, new PlayerBehavior());
  state.addBehavior(BlockBehavior.id, new BlockBehavior());

  const meshEntity = state.addEntity();
  MeshComponent.add(meshEntity);
  AddedTag.add(meshEntity);
  meshEntity.object.geometry = new SphereGeometry(24, 32, 32);
  meshEntity.object.material.color.set(0x00ffff);
  meshEntity.position.set(0, 32, 0);

  const light = new DirectionalLight(0xffffff, 1);
  light.position.set(0, 5, 10);
  light.lookAt(0, 0, 0);
  state.scene.add(light);

  addFrameRhythmCallback((_, time) => {
    light.position.x = Math.sin(time / 1000) * 10;
    light.position.z = Math.cos(time / 1000) * 10;
    meshEntity.position.y = Math.sin(time / 1000) * 10 + 32;
  });

  addSteadyRhythmCallback(100, () => systemMgr.updateServices());
  addFrameRhythmCallback((dt, time) => {
    if (!isNaN(dt)) {
      state.dt += dt;
    }
    state.time = time;
    systemMgr.update();
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

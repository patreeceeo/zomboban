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
import { SignInForm, SignInFormOptions } from "./SignInForm";

afterDOMContentLoaded(function handleDomLoaded() {
  const state = new State();

  const systemMgr = new SystemManager(state);

  systemMgr.push(createRouterSystem(ROUTES, DEFAULT_ROUTE));

  state.addBehavior(PlayerBehavior.id, new PlayerBehavior());
  state.addBehavior(BlockBehavior.id, new BlockBehavior());

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

declare const signInForm: HTMLFormElement;

afterDOMContentLoaded(function handleDomLoaded() {
  const formOptions = new SignInFormOptions(callback);
  const form = new SignInForm(signInForm, formOptions);

  (window as any).signIn = form.show.bind(form);

  async function callback(response: Response) {
    if (response.ok) {
      console.info("Sign in successful", response.status, response.statusText);
      form.hide();
    } else {
      console.info("Sign in failed", response.status, response.statusText);
    }
  }
});

(window as any).signOut = async () => {
  const response = await fetch("/logout", { method: "POST" });
  if (response.ok) {
    console.info("Sign out successful", response.status, response.statusText);
  } else {
    console.info("Sign out failed", response.status, response.statusText);
  }
};

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

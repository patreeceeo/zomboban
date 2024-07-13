import Alpine from "alpinejs";
import { State } from "./state";

export class AlpineStore implements Partial<State> {
  isSignedIn = false;

  constructor(readonly state: State) {}

  update() {
    this.isSignedIn = this.state.isSignedIn;
  }

  static install(state: State) {
    Alpine.store("_", new AlpineStore(state));
  }

  static sync() {
    const store = Alpine.store("_") as AlpineStore;
    store.update();
  }
}

export function startAlpine(state: State) {
  AlpineStore.install(state);
  Alpine.start();
}

export function syncAlpine() {
  AlpineStore.sync();
}

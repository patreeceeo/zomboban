import Alpine from "alpinejs";
import { State } from "./state";
import { Observable } from "./Observable";

type StateKeys = "isSignedIn";

export class AlpineStore implements Pick<State, StateKeys> {
  #changeObservable = new Observable<keyof State>();
  #stateKeys: StateKeys[] = ["isSignedIn"];
  isSignedIn = false;

  constructor(readonly state: State) {}

  update = () => {
    const { state } = this;
    const obs = this.#changeObservable;
    for (const key of this.#stateKeys) {
      const myVal = this[key];
      const stateVal = state[key];
      if (myVal !== stateVal) {
        this[key] = stateVal;
        obs.next(key);
      }
    }
  };

  addChangeObserver = (fn: (key: keyof State) => void) => {
    return this.#changeObservable.subscribe(fn);
  };

  static install(state: State) {
    Alpine.store("_", new AlpineStore(state));
  }

  static get instance() {
    return Alpine.store("_") as AlpineStore;
  }

  static sync() {
    AlpineStore.instance.update();
  }
}

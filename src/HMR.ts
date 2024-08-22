import { invariant } from "./Error";
import { State } from "./state";

export interface HMRSupport {
  state: State;
}

let hmrSupport: HMRSupport;

export function setupHMRSupport(state: State) {
  hmrSupport = {
    state
  };
}

export function getHMRSupport(): HMRSupport {
  invariant(hmrSupport !== undefined, `HMR suport has not been set up`);
  return hmrSupport;
}

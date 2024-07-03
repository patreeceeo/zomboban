import * as COMPONENTS from "./components";
import { EntityManagerState } from "./state";

export function registerComponents(state: EntityManagerState) {
  for (const component of Object.values(COMPONENTS)) {
    state.registerComponent(component);
  }
}

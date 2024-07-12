import { HypermediaServer } from "./Hypermedia";
import * as COMPONENTS from "./components";
import { EntityManagerState } from "./state";

export function registerComponents(state: EntityManagerState) {
  for (const component of Object.values(COMPONENTS)) {
    state.registerComponent(component);
  }
}

export function setupHypermedia(hypermediaServer: HypermediaServer) {
  hypermediaServer.get("/devtools", "src/ui/devtools.html");
}

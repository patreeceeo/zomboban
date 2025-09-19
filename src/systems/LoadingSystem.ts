import { System } from "../System";
import { State } from "../state";

export class LoadingItem {
  constructor(
    readonly description: string,
    readonly load: () => Promise<void>
  ) {}
}

export class LoadingSystem extends System<State> {
  start(state: State) {
    const { loadingItems } = state;
    loadingItems.stream(async (item) => {
      await item.load();
      loadingItems.remove(item);
    });
  }

  update(state: State) {
    state.loadingMax = Math.max(state.loadingMax, state.loadingItems.size);
    state.loadingProgress = state.loadingMax > 0
      ? (state.loadingMax - state.loadingItems.size) / state.loadingMax
      : 1;
    state.loadingGroupDescription = "";
    for (const item of state.loadingItems) {
      state.loadingGroupDescription = `${item.description}${
        state.loadingGroupDescription.length > 0 ? ", " : ""
      }${state.loadingGroupDescription}`;
    }
  }
}

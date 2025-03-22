import { System } from "../System";
import { LoadingState, TimeState } from "../state";

export class LoadingItem {
  constructor(
    readonly description: string,
    readonly load: () => Promise<void>
  ) {}
}

type Context = LoadingState & TimeState;

export class LoadingSystem extends System<Context> {
  start(state: Context) {
    const { loadingItems } = state;
    loadingItems.stream(async (item) => {
      await item.load();
      loadingItems.remove(item);
    });
  }

  update(state: Context) {
    state.loadingMax = Math.max(state.loadingMax, state.loadingItems.size);
    state.$loadingProgress =
      (state.loadingMax - state.loadingItems.size) / state.loadingMax;
    state.$loadingGroupDescription = "";
    for (const item of state.loadingItems) {
      state.$loadingGroupDescription = `${item.description}${
        state.$loadingGroupDescription.length > 0 ? ", " : ""
      }${state.$loadingGroupDescription}`;
    }
  }
}

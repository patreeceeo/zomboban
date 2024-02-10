import { PrimativeArrayComponent } from "../Component";

export enum LoadingState {
  Started,
  Completed,
  Failed,
}

export class LoadingStateComponent extends PrimativeArrayComponent<LoadingState> {
  constructor() {
    super([]);
  }
}

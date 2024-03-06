import { PrimativeArrayComponent } from "../Component";

export enum LoadingState {
  Started,
  Completed,
  Failed
}

export class LoadingStateComponentOld extends PrimativeArrayComponent<LoadingState> {
  constructor() {
    super([]);
  }
}

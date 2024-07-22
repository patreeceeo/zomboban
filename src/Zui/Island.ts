import { AwaitedValue } from "../Monad";

export interface Island {
  readonly templateHref: string;
  readonly mount?: string;
}

export type AwaitedController = AwaitedValue<IslandController>;

export type IslandsByNameMap = Record<string, Island>;

export class IslandController<Scope = Record<string, any>> {
  scope = {} as Scope;
  constructor(readonly root: HTMLElement) {}
  updateScope(state: any) {
    void state;
  }
  unmount() {}
}

export interface IslandElement extends HTMLElement {
  hydrate(): Promise<void>;
  isHydrated: boolean;
}

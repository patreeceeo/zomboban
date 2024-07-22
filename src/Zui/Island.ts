import { AwaitedValue } from "../Monad";

export interface Island {
  readonly templateHref: string;
  readonly mount?: string;
}

export type AwaitedController = AwaitedValue<IslandController>;

export type IslandsByNameMap = Record<string, Island>;

export class IslandController<
  Scope = Record<string, any>,
  OuterScope = Record<string, any>
> {
  scope = {} as Scope;
  constructor(readonly root: HTMLElement) {}
  updateScope(outerScope: OuterScope) {
    void outerScope;
  }
  unmount() {}
}

export interface IslandElement extends HTMLElement {
  hydrate(): Promise<void>;
  isHydrated: boolean;
}

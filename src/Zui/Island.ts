import { AwaitedValue } from "../Monad";

export interface Island {
  readonly templateHref: string;
  readonly mount?: string;
}

export type AwaitedController = AwaitedValue<IslandController>;

export type IslandsByNameMap = Record<string, Island>;

export class IslandController<
  Scope = Record<string, any>,
  Props = Record<string, any>
> {
  scope = {} as Scope;
  props = {} as Props;
  constructor(readonly root: Element) {}
  updateScope(props: Props) {
    void props;
  }

  unmount() {}

  toString() {
    return `Controller with scope ${JSON.stringify(this.scope)}`;
  }
}

export interface IslandElement extends HTMLElement {
  hydrate(): Promise<void>;
  canMount: boolean;
  mount(): Promise<void>;
  isHydrated: boolean;
}

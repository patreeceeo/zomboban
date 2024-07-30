import { AwaitedValue } from "../Monad";

export interface Island {
  readonly templateHref: string;
  loadController(): Promise<IConstructor<IslandController>>;
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
  render(): Promise<void>;
  hydrate(): Promise<void>;
  isHydrated: boolean;
  controller: IslandController;
}

export function loadNullController(): ReturnType<Island["loadController"]> {
  return Promise.resolve(IslandController as IConstructor<IslandController>);
}

export function createIslandMap(
  templatesByName: Record<string, string>,
  loadControllersByName: Record<string, Island["loadController"]>
): IslandsByNameMap {
  const result = {} as IslandsByNameMap;
  for (const [key, value] of Object.entries(templatesByName)) {
    result[key] = {
      templateHref: value,
      loadController: loadNullController
    };
  }
  for (const [key, value] of Object.entries(loadControllersByName)) {
    result[key].loadController = value;
  }
  return result;
}

export interface Island {
  readonly templateHref: string;
  readonly mount?: string;
}

export type IslandsByNameMap = Record<string, Island>;

export class IslandController<Scope = Record<string, any>> {
  scope = {} as Scope;
  constructor(readonly root: HTMLElement) {}
  update(state: any) {
    void state;
  }
  unmount() {}
}

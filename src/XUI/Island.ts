export interface Island {
  readonly templateHref: string;
  readonly mount?: string;
}

export type IslandsByNameMap = Record<string, Island>;

export class IslandController {
  constructor(readonly root: HTMLElement) {}
}

export class Island {
  constructor(
    readonly templateHref: string,
    readonly scriptImportSpec: string
  ) {}

  async loadControllerKlass() {
    const { default: ControllerKlass } = await import(
      /* @vite-ignore */ this.scriptImportSpec
    );
    return ControllerKlass;
  }
}

export class IslandController {
  constructor(readonly root: HTMLElement) {}
}

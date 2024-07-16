export class Island {
  constructor(
    readonly templateHref: string,
    readonly scriptImportSpec?: string
  ) {}

  async loadControllerKlass() {
    if (this.scriptImportSpec !== undefined) {
      const { default: ControllerKlass } = await import(
        /* @vite-ignore */ this.scriptImportSpec
      );
      return ControllerKlass;
    }
    return IslandController;
  }
}

export class IslandController {
  constructor(readonly root: HTMLElement) {}
}

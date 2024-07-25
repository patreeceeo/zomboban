import { IslandController } from "../Zui/Island";
import { withHMR } from "../Zui/HMR";

class Scope {}

class Props {}

class Tools extends IslandController<Scope, Props> {
  scope = new Scope();
  props = new Props();
  constructor(root: HTMLElement) {
    super(root);
  }
}

let defaultExport = Tools;

if (import.meta.hot) {
  const { Clazz, accept } = withHMR(defaultExport);
  defaultExport = Clazz as IConstructor<Tools>;
  import.meta.hot.accept(accept);
}

export default defaultExport;

import { withHMR } from "Zui/HMR";
import { IslandController } from "Zui/Island";

class Props {
  "is-at-start" = false;
}

class Scope {
  isAtStart = false;
}

class MainMenu extends IslandController {
  props = new Props();
  scope = new Scope();
  updateScope(props: Props): void {
    this.scope.isAtStart = props["is-at-start"];
  }
}

let defaultExport = MainMenu;

if (import.meta.hot) {
  const { Clazz, accept } = withHMR(defaultExport);
  defaultExport = Clazz as IConstructor<MainMenu>;
  import.meta.hot.accept(accept);
}

export default defaultExport;

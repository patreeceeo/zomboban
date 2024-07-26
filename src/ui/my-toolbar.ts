import { IslandController } from "../Zui/Island";
import { withHMR } from "../Zui/HMR";
import { restartGameEvent } from "./events";

class Scope {
  isSignedIn = false;
  handleClickReset = restartGameEvent.mapHandler;
}

class Props {
  "is-signed-in" = false;
}

class Toolbar extends IslandController<Scope, Props> {
  scope = new Scope();
  props = new Props();
  constructor(root: HTMLElement) {
    super(root);
  }

  updateScope(props: Props) {
    this.scope.isSignedIn = props["is-signed-in"];
  }

  unmount() {}
}

let defaultExport = Toolbar;

if (import.meta.hot) {
  const { Clazz, accept } = withHMR(defaultExport);
  defaultExport = Clazz as IConstructor<Toolbar>;
  import.meta.hot.accept(accept);
}

export default defaultExport;

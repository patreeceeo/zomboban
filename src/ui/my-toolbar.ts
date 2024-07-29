import { IslandController } from "../Zui/Island";
import { withHMR } from "../Zui/HMR";
import { handleShowMenu } from "../inputs";

class Scope {
  isSignedIn = false;
  isNotPlaying = false;
  isUndoing = false;
  handlePressMenu() {
    handleShowMenu();
  }
}

class Props {
  "is-signed-in" = false;
  "is-paused" = false;
  "is-undoing" = false;
}

class Toolbar extends IslandController<Scope, Props> {
  scope = new Scope();
  props = new Props();

  updateScope(props: Props) {
    const { scope } = this;
    scope.isSignedIn = props["is-signed-in"];
    scope.isNotPlaying = props["is-paused"] || props["is-undoing"];
    scope.isUndoing = props["is-undoing"];
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

import { IslandController } from "../Zui/Island";
import { withHMR } from "../Zui/HMR";
import { handleShowMenu } from "../inputs";

class Scope {
  isNotPlaying = false;
  isUndoing = false;
  isSignedIn = false;
  handlePressMenu() {
    handleShowMenu();
  }
}

class Props {
  "is-paused" = false;
  "is-undoing" = false;
  "is-signed-in" = false;
}

class Toolbar extends IslandController<Scope, Props> {
  scope = new Scope();
  props = new Props();

  updateScope(props: Props) {
    const { scope } = this;
    scope.isNotPlaying = props["is-paused"] || props["is-undoing"];
    scope.isUndoing = props["is-undoing"];
    scope.isSignedIn = props["is-signed-in"];
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

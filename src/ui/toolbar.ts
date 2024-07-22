import { IslandController } from "Zui";
import { withHMR } from "Zui/HMR";
import { State } from "../state";

class Scope {
  isSignedIn = false;
}

class DevTools extends IslandController<Scope, State> {
  constructor(root: HTMLElement) {
    super(root);
    root.onclick = this.handleClick;
  }

  handleClick = () => {
    console.log("you clicked");
  };

  updateScope(outerScope: State) {
    this.scope.isSignedIn = outerScope.isSignedIn;
  }

  unmount() {}
}

let defaultExport = DevTools;

if (import.meta.hot) {
  const { Clazz, accept } = withHMR(defaultExport);
  defaultExport = Clazz as IConstructor<DevTools>;
  import.meta.hot.accept(accept);
}

export default defaultExport;

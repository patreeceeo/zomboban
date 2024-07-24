import { IslandController } from "Zui";
import { withHMR } from "Zui/HMR";

class Scope {
  isSignedIn = false;
}

class Props {
  "is-signed-in" = false;
}

class DevTools extends IslandController<Scope, Props> {
  scope = new Scope();
  props = new Props();
  constructor(root: HTMLElement) {
    super(root);
    root.onclick = this.handleClick;
  }

  handleClick = () => {
    console.log("you clicked");
  };

  updateScope(props: Props) {
    this.scope.isSignedIn = props["is-signed-in"];
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

import { IslandController } from "../Zui/Island";
import { withHMR } from "../Zui/HMR";
import { BASE_URL } from "../constants";
import { joinPath } from "../util";

class Scope {
  src = "";
}

class Props {
  id = "";
}

class Clazz extends IslandController<Scope, Props> {
  scope = new Scope();
  props = new Props();
  constructor(root: HTMLElement) {
    super(root);
  }

  updateScope(props: Props) {
    const { scope } = this;
    scope.src = joinPath(BASE_URL, "assets", "images", props.id);
  }

  unmount() {}
}

let defaultExport = Clazz;

if (import.meta.hot) {
  const { Clazz, accept } = withHMR(defaultExport);
  defaultExport = Clazz as IConstructor<Clazz>;
  import.meta.hot.accept(accept);
}

export default defaultExport;

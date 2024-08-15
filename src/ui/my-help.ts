import { withHMR } from "Zui/HMR";
import { IslandController } from "Zui/Island";

class Scope {}

class Help extends IslandController {
  scope = new Scope();
}

let defaultExport = Help;

if (import.meta.hot) {
  const { Clazz, accept } = withHMR(defaultExport);
  defaultExport = Clazz as IConstructor<Help>;
  import.meta.hot.accept(accept);
}

export default defaultExport;

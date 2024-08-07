import { withHMR } from "Zui/HMR";
import DialogIslandController from "./DialogIslandController";

class Scope {}

class Help extends DialogIslandController {
  scope = new Scope();
}

let defaultExport = Help;

if (import.meta.hot) {
  const { Clazz, accept } = withHMR(defaultExport);
  defaultExport = Clazz as IConstructor<Help>;
  import.meta.hot.accept(accept);
}

export default defaultExport;

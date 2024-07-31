import { withHMR } from "Zui/HMR";
import DialogIslandController from "./DialogIslandController";

class MainMenu extends DialogIslandController {}

let defaultExport = MainMenu;

if (import.meta.hot) {
  const { Clazz, accept } = withHMR(defaultExport);
  defaultExport = Clazz as IConstructor<MainMenu>;
  import.meta.hot.accept(accept);
}

export default defaultExport;

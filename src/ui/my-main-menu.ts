import { withHMR } from "Zui/HMR";
import { gameRoute, helpRoute } from "../routes";
import DialogIslandController from "./DialogIslandController";

class Scope {
  handlePlay() {
    gameRoute.follow();
  }
  handleHelp() {
    helpRoute.follow();
  }
}

class MainMenu extends DialogIslandController {
  scope = new Scope();
}

let defaultExport = MainMenu;

if (import.meta.hot) {
  const { Clazz, accept } = withHMR(defaultExport);
  defaultExport = Clazz as IConstructor<MainMenu>;
  import.meta.hot.accept(accept);
}

export default defaultExport;

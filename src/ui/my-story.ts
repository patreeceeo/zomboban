import { withHMR } from "Zui/HMR";
import { menuRoute } from "../routes";
import DialogIslandController from "./DialogIslandController";

class Scope {
  handleBack() {
    menuRoute.follow();
  }
}

class Story extends DialogIslandController {
  scope = new Scope();
}

let defaultExport = Story;

if (import.meta.hot) {
  const { Clazz, accept } = withHMR(defaultExport);
  defaultExport = Clazz as IConstructor<Story>;
  import.meta.hot.accept(accept);
}

export default defaultExport;

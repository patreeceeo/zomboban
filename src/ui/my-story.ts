import { withHMR } from "Zui/HMR";
import { menuRoute } from "../routes";
import { IslandController } from "Zui/Island";

class Scope {
  handleBack() {
    menuRoute.follow();
  }
}

class Story extends IslandController {
  scope = new Scope();
}

let defaultExport = Story;

if (import.meta.hot) {
  const { Clazz, accept } = withHMR(defaultExport);
  defaultExport = Clazz as IConstructor<Story>;
  import.meta.hot.accept(accept);
}

export default defaultExport;

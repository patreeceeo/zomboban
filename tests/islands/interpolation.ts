import { IslandController } from "../../src/Zui/Island";

class Scope {
  $favNum = 0;
  increment = () => {
    this.$favNum++;
  };
}

export default class Controller extends IslandController<Scope> {
  scope = new Scope();
}

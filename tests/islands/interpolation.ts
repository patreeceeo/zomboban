import { IslandController } from "Zui";

class Scope {
  $favNum = 0;
  increment = () => {
    this.$favNum++;
  };
}

export default class Controller extends IslandController<Scope> {
  scope = new Scope();
}

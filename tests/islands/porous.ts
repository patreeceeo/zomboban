import { IslandController } from "Zui";
import { TopLevelScope } from "../setup";

class Scope {
  $message = "nothing yet";
}

export default class Controller extends IslandController<Scope, TopLevelScope> {
  scope = new Scope();
  updateScope(outerScope: TopLevelScope): void {
    this.scope.$message = outerScope.canPigsFly
      ? "pigs can fly"
      : "pigs are just pigs";
  }
}

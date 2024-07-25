import { IslandController } from "Zui";

class Scope {
  $message = "nothing yet";
  canPigsFly = false;
}

class Props {
  "can-fly" = false;
}

export default class Controller extends IslandController<Scope, Props> {
  scope = new Scope();
  props = new Props();
  updateScope(props: Props): void {
    const { scope } = this;
    scope.canPigsFly = props["can-fly"];
    scope.$message = scope.canPigsFly ? "pigs can fly" : "pigs are just pigs";
  }
}

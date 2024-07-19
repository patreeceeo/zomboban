import { IslandController } from "Zui";

class Scope {
  handleClick = (event: MouseEvent) => {
    const button = event.target as HTMLElement;
    button.innerText = "Clicked";
  };
}

export default class Controller extends IslandController<Scope> {
  scope = new Scope();
}

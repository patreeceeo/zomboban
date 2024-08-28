import { IslandController } from "../Zui/Island";
import { withHMR } from "../Zui/HMR";
import { signOutEvent } from "./events";

class Scope {
  $currentLevelId = 0;
}

class Props {
  "current-level-id" = 0;
}

class Tools extends IslandController<Scope, Props> {
  scope = new Scope();
  props = new Props();
  #select: HTMLSelectElement;
  constructor(root: HTMLElement) {
    super(root);
    const button = root.querySelector("button[x-signout]")!;
    button.addEventListener("htmx:afterRequest", (event: Event) => {
      const { detail } = event as CustomEvent<HtmxResponseInfo>;
      if (detail.successful) {
        signOutEvent.trigger(button);
      }
    });
    this.#select = root.querySelector("select")!;
  }

  updateScope(props: Props): void {
    this.#select.value = String(props["current-level-id"]);
  }
}

let defaultExport = Tools;

if (import.meta.hot) {
  const { Clazz, accept } = withHMR(defaultExport);
  defaultExport = Clazz as IConstructor<Tools>;
  import.meta.hot.accept(accept);
}

export default defaultExport;

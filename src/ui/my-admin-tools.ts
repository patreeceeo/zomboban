import { IslandController } from "../Zui/Island";
import { withHMR } from "../Zui/HMR";
import { signOutEvent } from "./events";

class Scope {}

class Props {}

class Tools extends IslandController<Scope, Props> {
  scope = new Scope();
  props = new Props();
  constructor(root: HTMLElement) {
    super(root);
    const button = root.querySelector("button[hx-post=logout]")!;
    button.addEventListener("htmx:afterRequest", (event: Event) => {
      const { detail } = event as CustomEvent<HtmxResponseInfo>;
      if (detail.successful) {
        signOutEvent.trigger(button);
      }
    });
  }
}

let defaultExport = Tools;

if (import.meta.hot) {
  const { Clazz, accept } = withHMR(defaultExport);
  defaultExport = Clazz as IConstructor<Tools>;
  import.meta.hot.accept(accept);
}

export default defaultExport;

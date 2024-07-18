import { IslandController } from "xui";
import { withHMR } from "xui/HMR";

class DevTools extends IslandController {
  constructor(root: HTMLElement) {
    super(root);
    root.onclick = this.handleClick;
  }

  handleClick = () => {
    console.log("you clicked");
  };

  unmount() {}
}

let defaultExport = DevTools;

if (import.meta.hot) {
  const { Clazz, accept } = withHMR(defaultExport);
  defaultExport = Clazz as IConstructor<DevTools>;
  import.meta.hot.accept(accept);
}

export default defaultExport;

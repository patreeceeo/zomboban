import { IslandController } from "xui";

if (import.meta.hot) {
  console.log("it's hot!");
  import.meta.hot.accept((newMod) => {
    console.log("accepting hotness!", newMod);
    if (newMod) {
      const NewKlass = newMod.default as typeof DevTools;
      const oldInstances = instances;
      instances = new Set<DevTools>();
      for (const instance of oldInstances) {
        instance.unmount();
        new NewKlass(instance.root);
      }
    }
  });
}

let instances = new Set<DevTools>();

export default class DevTools extends IslandController {
  constructor(root: HTMLElement) {
    super(root);
    root.onclick = this.handleClick;
    instances.add(this);
  }

  handleClick = () => {
    console.log("you clicked me!");
  };

  unmount() {
    this.root.onclick = null;
  }
}

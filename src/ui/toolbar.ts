import { IslandController } from "xui";

if (import.meta.hot) {
  import.meta.hot.accept((newMod) => {
    // TODO encapsulate this in a decorator and test it
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
    console.log("you clicked");
  };

  unmount() {}
}

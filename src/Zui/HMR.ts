import { ModuleNamespace } from "vite/types/hot.js";
import { IslandController } from "./Island";

interface WithHMR {
  Clazz: IConstructor<IslandController>;
  accept: (newMod?: ModuleNamespace) => void;
}

export function withHMR(Clazz: IConstructor<IslandController>): WithHMR {
  let instances = new Set<InstanceType<typeof Clazz>>();
  class SubClazz extends Clazz {
    constructor(...args: ConstructorParameters<typeof Clazz>) {
      super(...args);
      instances.add(this);
    }
  }

  function accept(newMod?: ModuleNamespace) {
    if (newMod) {
      const NewKlass = newMod.default as IConstructor<IslandController>;
      const oldInstances = instances;
      instances = new Set<InstanceType<typeof Clazz>>();
      for (const instance of oldInstances) {
        instance.unmount();
        new NewKlass(instance.root);
      }
    }
  }

  return {
    Clazz: SubClazz,
    accept
  };
}

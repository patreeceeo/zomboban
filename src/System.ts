interface SystemService {
  update(): void;
}

export class System<Context> {
  start() {}
  update(context: Context) {
    void context;
  }
  stop() {}
  services = [] as SystemService[];
}

export class SystemManager<Context> {
  Systems = new Set<IConstructor<System<Context>>>();
  systems = [] as System<Context>[];
  push(System: new () => System<Context>) {
    if (!this.Systems.has(System)) {
      const system = new System();
      system.start();
      this.Systems.add(System);
      this.systems.push(system);
    }
  }
  update(context: Context) {
    for (const system of this.systems) {
      system.update(context);
    }
  }
  updateServices() {
    for (const system of this.systems) {
      for (const service of system.services) {
        service.update();
      }
    }
  }
  remove(System: IConstructor<System<Context>>) {
    this.Systems.delete(System);
    for (const [index, system] of this.systems.entries()) {
      if (system.constructor === System) {
        system.stop();
        this.systems.splice(index, 1);
        break;
      }
    }
  }
}

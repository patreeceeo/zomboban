import { LogLevel } from "./Log";
import {IQueryPredicate} from "./Query";
import {RhythmType, FrameRhythm, FixedStepRhythm} from "./Rhythm";
import { State } from "./state";
import { log } from "./util";
import { invariant } from "./Error";
import {TimeState} from "./state/time";

interface MinimalState {
  time: TimeState;
}

interface SystemService<Context> {
  update(context: Context): void;
}

export interface ISystemConstructor<Context extends MinimalState> {
  new (mgr: SystemManager<Context>): System<Context>;
}

export class System<Context extends MinimalState> {
  resources = [] as IResourceHandle[];
  constructor(readonly mgr: SystemManager<Context>) {}
  rhythmType = RhythmType.FixedStep;
  log(message: string, level?: LogLevel, ...addtlSubjects: any[]) {
    log.append(message, level, this, ...addtlSubjects);
  }
  start(context: Context): Promise<void> | void {
    void context;
  }
  update(context: Context) {
    void context;
  }
  stop(context: Context) {
    void context;
  }
  services = [] as SystemService<Context>[];
  toString() {
    return this.constructor.name;
  }
}

export class SystemWithQueries<
  Context extends State
> extends System<Context> {
  createQuery<Components extends readonly IQueryPredicate<any>[]>(
    components: Components
  ) {
    return this.mgr.context.query.create(components);
  }
}

export class SystemManager<Context extends MinimalState> {
  constructor(public context: Context) {}
  Systems = new Set<ISystemConstructor<any>>();
  systems = [] as System<any>[];
  readySystems = [] as System<any>[];

  // Group systems by rhythm type
  frameSystemsReady = [] as System<any>[];
  fixedStepSystemsReady = [] as System<any>[];

  // Rhythm instances
  frameRhythm?: FrameRhythm;
  fixedStepRhythm?: FixedStepRhythm;

  async #startSystem(system: System<any>) {
    const startResult = system.start(this.context);

    if (startResult !== undefined) {
      await startResult;
      this.#addToReadySystems(system);
    } else {
      // Synchronous start - system is immediately ready
      this.#addToReadySystems(system);
    }
  }

  #addToReadySystems(system: System<any>) {
    this.readySystems.push(system);

    // Also add to rhythm-specific arrays
    if (system.rhythmType === RhythmType.Frame) {
      this.frameSystemsReady.push(system);
    } else if (system.rhythmType === RhythmType.FixedStep) {
      this.fixedStepSystemsReady.push(system);
    }
  }

  #removeFromReadySystems(system: System<any>) {
    const readyIndex = this.readySystems.indexOf(system);
    if (readyIndex !== -1) {
      this.readySystems.splice(readyIndex, 1);
    }

    // Also remove from rhythm-specific arrays
    if (system.rhythmType === RhythmType.Frame) {
      const frameIndex = this.frameSystemsReady.indexOf(system);
      if (frameIndex !== -1) {
        this.frameSystemsReady.splice(frameIndex, 1);
      }
    } else if (system.rhythmType === RhythmType.FixedStep) {
      const fixedIndex = this.fixedStepSystemsReady.indexOf(system);
      if (fixedIndex !== -1) {
        this.fixedStepSystemsReady.splice(fixedIndex, 1);
      }
    }
  }

  async push(...Systems: ISystemConstructor<any>[]) {
    for (const System of Systems) {
      if (!this.Systems.has(System)) {
        const system = new System(this);
        this.Systems.add(System);
        await this.#startSystem(system);
        this.systems.push(system);
      }
    }
  }

  async insert(System: ISystemConstructor<any>, index = 0) {
    const system = new System(this);
    this.Systems.add(System);
    await this.#startSystem(system);
    this.systems.splice(index, 0, system);
  }

  reorder(System: ISystemConstructor<any>, toIndex = 0) {
    let index = 0;
    for (const system of this.systems) {
      if (system instanceof System) {
        this.systems.splice(index, 1);
        this.systems.splice(toIndex, 0, system);
        break;
      }
      index++;
    }
  }

  start() {
    invariant(this.frameRhythm === undefined, "SystemManager is already started");
    invariant(this.fixedStepRhythm === undefined, "SystemManager is already started");

    // Create rhythms
    this.frameRhythm = new FrameRhythm((deltaTime: number, _elapsedTime: number) => {
      this.#updateFrameSystems(deltaTime);
    });

    this.fixedStepRhythm = new FixedStepRhythm((fixedDelta: number) => {
      this.#updateFixedStepSystems(fixedDelta);
    }, this.context.time.fixedDelta);

    // Start rhythms
    this.frameRhythm.start();
    this.fixedStepRhythm.start();
  }

  stop() {
    this.frameRhythm?.stop();
    this.fixedStepRhythm?.stop();
    this.frameRhythm = undefined;
    this.fixedStepRhythm = undefined;
  }

  #updateFrameSystems(deltaTime: number) {
    // Update frame delta for systems that need it
    this.context.time.frameDelta = deltaTime;
    this.context.time.frameTotal += deltaTime;

    for (const system of this.frameSystemsReady) {
      system.update(this.context);
    }
  }

  #updateFixedStepSystems(fixedDelta: number) {
    // Update time for fixed step systems
    this.context.time.fixedTotal += fixedDelta;

    for (const system of this.fixedStepSystemsReady) {
      system.update(this.context);
    }
  }

  updateServices() {
    const { context } = this;
    for (const system of this.readySystems) {
      for (const service of system.services) {
        service.update(context);
      }
    }
  }

  remove(System: ISystemConstructor<any>) {
    const { context } = this;
    this.Systems.delete(System);
    for (const [index, system] of this.systems.entries()) {
      if (system.constructor === System) {
        system.stop(context);
        for (const resource of system.resources) {
          resource.release();
        }
        this.systems.splice(index, 1);

        this.#removeFromReadySystems(system);
        break;
      }
    }
  }

  clear() {
    const { context } = this;
    for (const system of this.systems) {
      system.stop(context);
      for (const resource of system.resources) {
        resource.release();
      }
    }
    this.Systems.clear();
    this.systems.length = 0;
    this.readySystems.length = 0;
    this.frameSystemsReady.length = 0;
    this.fixedStepSystemsReady.length = 0;

    this.stop();
  }
}

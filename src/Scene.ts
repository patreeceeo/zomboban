import { invariant } from "./Error";
import { drainInputQueues } from "./Input";
import {
  addFrameRhythmCallback,
  addSteadyRhythmCallback,
  removeRhythmCallback,
} from "./Rhythm";

interface Service {
  /** The update interval in milliseconds */
  interval: number;
  update(): void;
}

type ServiceList = ReadonlyArray<Service>;

export interface Scene {
  start(): void;
  update(deltaTime: number, elapsedTime: number): void;
  services: ServiceList;
  stop(): void;
}

export class SceneManager {
  #currentScene?: Scene;
  #rhythmIds: Array<number> = [];
  #registeredScenes: Array<Scene> = [];
  #sharedEntityIds: Array<number> = [];

  registerScene(scene: Scene, id = this.#registeredScenes.length): number {
    invariant(
      this.#registeredScenes[id] === undefined,
      `Scene ${id} is already registered`,
    );
    this.#registeredScenes[id] = scene;
    return id;
  }

  getScene(id: number): Scene {
    const scene = this.#registeredScenes[id];
    invariant(scene !== undefined, `Scene ${id} is not registered`);
    return scene;
  }

  shareEntity(id: number, alias: number): number {
    this.#sharedEntityIds[alias] = id;
    return id;
  }

  getSharedEntity(alias: number): number {
    const id = this.#sharedEntityIds[alias];
    invariant(id !== undefined, `No entity for alias ${alias}`);
    return id;
  }

  start(id: number): void {
    this.#rhythmIds.forEach(removeRhythmCallback);
    this.#rhythmIds.length = 0;
    this.#currentScene?.stop();

    const scene = this.getScene(id);

    this.#currentScene = scene;
    this.#rhythmIds.push(addFrameRhythmCallback(scene.update));
    for (const service of scene.services) {
      this.#rhythmIds.push(
        addSteadyRhythmCallback(service.interval, service.update),
      );
    }
    drainInputQueues();

    scene.start();
  }
}

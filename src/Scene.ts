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

export type SceneConstructor = new () => Scene;
type SceneImporter = () => Promise<SceneConstructor>;

export class SceneManager {
  #currentScene?: Scene;
  #rhythmIds: Array<number> = [];
  #registeredScenes: Array<SceneImporter> = [];
  #constructedScenes: Array<Scene> = [];
  #sharedEntityIds: Array<number> = [];

  registerScene(
    scene: SceneImporter,
    id = this.#registeredScenes.length,
  ): number {
    invariant(
      this.#registeredScenes[id] === undefined,
      `Scene ${id} is already registered`,
    );
    this.#registeredScenes[id] = scene;
    return id;
  }

  async getScene(id: number): Promise<Scene> {
    let scene = this.#constructedScenes[id];
    if (scene === undefined) {
      const importer = this.#registeredScenes[id];
      invariant(importer !== undefined, `Scene ${id} is not registered`);
      const Constructor = await importer();
      scene = new Constructor();
      this.#constructedScenes[id] = scene;
    }
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

  async start(id: number): Promise<void> {
    const scene = await this.getScene(id);

    this.#rhythmIds.forEach(removeRhythmCallback);
    this.#rhythmIds.length = 0;
    this.#rhythmIds.push(addFrameRhythmCallback(scene.update));
    for (const service of scene.services) {
      this.#rhythmIds.push(
        addSteadyRhythmCallback(service.interval, service.update),
      );
    }

    this.#currentScene?.stop();
    this.#currentScene = scene;

    drainInputQueues();

    scene.start();
  }
}

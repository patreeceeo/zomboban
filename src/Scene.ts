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

  start(scene: Scene): void {
    this.#rhythmIds.forEach(removeRhythmCallback);
    this.#rhythmIds.length = 0;
    this.#currentScene?.stop();

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

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
  update(deltaTime: number, elapsedTime: number): Scene;
  services: ServiceList;
  stop(): void;
}

export class SceneManager {
  #currentScene?: Scene;
  #rhythmIds: Array<number> = [];

  start(scene: Scene): void {
    this.#currentScene?.stop();
    this.#rhythmIds.forEach(removeRhythmCallback);
    this.#rhythmIds.length = 0;

    this.#currentScene = scene;
    this.#rhythmIds.push(
      addFrameRhythmCallback((deltaTime, elapsedTime) => {
        const newScene = scene.update(deltaTime, elapsedTime);
        if (newScene !== this.#currentScene) {
          this.start(newScene);
        }
      }),
    );
    for (const service of scene.services) {
      this.#rhythmIds.push(
        addSteadyRhythmCallback(service.interval, service.update),
      );
    }
    drainInputQueues();

    scene.start();
  }
}

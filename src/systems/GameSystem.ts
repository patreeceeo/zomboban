import { System } from "../System";
import { State } from "../state";
import { CameraSystem } from "./CameraSystem";
import { RenderSystem } from "./RenderSystem";

export class GameSystem extends System<State> {
  start(context: State) {
    this.mgr.push(CameraSystem, context);
    this.mgr.push(RenderSystem, context);
  }
}

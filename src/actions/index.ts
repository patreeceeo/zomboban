import {
  CameraState,
  TimeState,
} from "../state";
import { Action } from "../Action";
import { ActionEntity } from "../systems/ActionSystem";
import {
  HeadingDirectionComponent,
  TransformComponent,
} from "../components";
import { Vector3 } from "three";
import { HeadingDirection, HeadingDirectionValue } from "../HeadingDirection";
import { convertToPixels } from "../units/convert";
import { Tiles } from "../units/types";
import {raise} from "../Error";

const getTurnTime = () => 30;

export class MoveAction<
  Entity extends ActionEntity<typeof TransformComponent>
> extends Action<Entity, TimeState> {
  readonly start = new Vector3();
  readonly delta = new Vector3();
  constructor(entity: Entity, startTime: number, duration: number, deltaTiles: Vector3) {
    super(entity, startTime, duration);
    const { start, delta } = this;
    const { position } = entity.transform;
    start.copy(position);
    delta.x = convertToPixels(deltaTiles.x as Tiles);
    delta.y = convertToPixels(deltaTiles.y as Tiles);
    delta.z = convertToPixels(deltaTiles.z as Tiles);
  }
  update(): void {
    const { entity, delta, progress, start } = this;
    const { transform } = entity;
    const { position } = transform;

    position.set(
      start.x + delta.x * progress,
      start.y + delta.y * progress,
      0
    );
  }
  humanName = "Move";
  toString(): string {
    const { delta } = this;
    return `${super.toString()} x: ${delta.x} y: ${delta.y}`;
  }
}

export class RotateAction extends Action<
  ActionEntity<typeof TransformComponent | typeof HeadingDirectionComponent>,
  TimeState
> {
  initial: HeadingDirectionValue;
  constructor(
    entity: ActionEntity<
      typeof TransformComponent | typeof HeadingDirectionComponent
    >,
    startTime: number,
    readonly target: HeadingDirectionValue
  ) {
    super(entity, startTime, getTurnTime());
    this.initial = entity.headingDirection;
  }
  getRotationDelta(targetRads: number, currentRads: number) {
    if (currentRads === targetRads) {
      return 0;
    }
    if (Math.abs(targetRads - currentRads) > Math.PI) {
      if (targetRads > currentRads) {
        currentRads += Math.PI * 2;
      } else {
        targetRads += Math.PI * 2;
      }
    }
    return targetRads - currentRads;
  }
  update() {
    const { entity, target, initial } = this;
    const { rotation } = entity.transform;
    const initialRads = HeadingDirection.getRadians(initial);
    const targetRads = HeadingDirection.getRadians(target);
    const delta = this.getRotationDelta(targetRads, initialRads);

    rotation.z = initialRads + delta * this.progress;

    if (this.progress >= 1) {
      entity.headingDirection = target;
    }
  }
  humanName = "Rotate";
  toString(): string {
    return `${super.toString()} direction: ${HeadingDirection.stringify(
      this.target
    )}`;
  }
}



export class CameraShakeAction<
  Entity extends ActionEntity<typeof TransformComponent>
> extends Action<Entity, CameraState> {
  position = new Vector3();
  #previousCameraController?: { position: Vector3 };
  onStart(state: CameraState): void {
    super.onStart(state);
    const { cameraController } = state;
    if (cameraController !== undefined) {
      this.position.copy(cameraController.position);
      this.#previousCameraController = cameraController;
    } else {
      raise("Camera shake action requires a camera controller!");
    }
    state.cameraController = this;
  }
  onComplete(state: CameraState) {
    super.onComplete(state);
    state.cameraController = this.#previousCameraController;
  }
  update(_state: CameraState) {
    const { position, progress } = this;
    position.copy(this.#previousCameraController!.position);
    const delta = (1 - progress) * 12;
    if (progress % 0.4 < 0.2) {
      position.y -= delta;
    } else {
      position.y += delta;
    }
  }
}









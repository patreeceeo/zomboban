import { State } from "../state";
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
import {TimeBasedMutexLock} from "../Mutex";

const getTurnTime = () => 30;

export class MoveAction<
  Entity extends ActionEntity<typeof TransformComponent>
> extends Action<Entity, State> {
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
  State
> {
  initial: HeadingDirectionValue;
  constructor(
    entity: ActionEntity<
      typeof TransformComponent | typeof HeadingDirectionComponent
    >,
    startTime: number,
    readonly target: HeadingDirectionValue,
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
> extends Action<Entity, State> {
  static mutex = new TimeBasedMutexLock();
  initialCameraOffset = new Vector3();
  angleOfOpticalPlane: number;
  mutexSuccess = CameraShakeAction.mutex.lock();
  constructor(
    entity: Entity,
    startTime: number,
    readonly duration: number,
    readonly cameraState: State
  ) {
    super(entity, startTime, duration);
    const { cameraOffset } = cameraState.render;
    this.initialCameraOffset.copy(cameraOffset);
    // Calculate the angle of the optical axis based on the cameraOffset
    const angleOfOpticalAxis = Math.atan2(cameraOffset.z, cameraOffset.y);
    // Calculate the right angle to that angle
    this.angleOfOpticalPlane = angleOfOpticalAxis + Math.PI / 2;
  }
  onStart() {
    const {mutexSuccess, cameraState} = this;
    if(mutexSuccess) {
      cameraState.render.lookAtTarget = false;
    }
    // console.log(`Camera shake started with initial offset: ${this.initialCameraOffset.toArray()}`);
  }
  onComplete() {
    const {mutexSuccess, cameraState} = this;
    if(mutexSuccess) {
      cameraState.render.lookAtTarget = true;
    }
    // console.log(`Camera shake completed, resetting camera offset to: ${cameraOffset.toArray()}`);
  }
  update() {
    if(!this.mutexSuccess) {
      // If the mutex is locked, we do nothing
      return;
    }
    const { progress, cameraState, initialCameraOffset } = this;
    const { cameraOffset } = cameraState.render;

    const delta = Math.sin(progress * Math.PI * 6) * 20;
    // move camera along the optical plane
    cameraOffset.y =
      initialCameraOffset.y + delta * Math.cos(this.angleOfOpticalPlane);
    cameraOffset.z =
      initialCameraOffset.z + delta * Math.sin(this.angleOfOpticalPlane);

  }
}









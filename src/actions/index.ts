import {
  CameraState,
  EntityManagerState,
  RendererState,
  TimeState
} from "../state";
import { Action, ActionEntity } from "../systems/ActionSystem";
import {
  AddedTag,
  AnimationComponent,
  ChangedTag,
  HeadingDirectionComponent,
  TransformComponent
} from "../components";
import { Vector2, Vector3 } from "three";
import { convertToTiles } from "../units/convert";
import { IEntityPrefab } from "../EntityManager";
import { ITypewriterCursor } from "../Typewriter";
import { normalizeAngle } from "../util";
import { HeadingDirection, HeadingDirectionValue } from "../HeadingDirection";
import { EntityWithComponents } from "../Component";

function getTileVector(
  position: { x: number; y: number },
  target = new Vector2()
) {
  return target.set(convertToTiles(position.x), convertToTiles(position.y));
}

declare const moveTimeInput: HTMLInputElement;
function getMoveTime() {
  return parseInt(moveTimeInput.value);
}
declare const turnTimeInput: HTMLInputElement;
function getTurnTime() {
  return parseInt(turnTimeInput.value);
}

export class MoveAction extends Action<
  ActionEntity<typeof TransformComponent>,
  TimeState
> {
  start = new Vector2();
  delta = new Vector2();
  constructor(
    entity: ActionEntity<typeof TransformComponent>,
    headingDirection: HeadingDirectionValue
  ) {
    super(entity);
    const { start, delta } = this;
    const { position } = entity.transform;
    HeadingDirection.getVector(headingDirection, delta);
    start.copy(position);
  }
  isAtTargetPosition(position: Vector3, start: Vector2, delta: Vector2) {
    return (
      (position.x >= start.x + delta.x && delta.x > 0) ||
      (position.x <= start.x + delta.x && delta.x < 0) ||
      (position.y >= start.y + delta.y && delta.y > 0) ||
      (position.y <= start.y + delta.y && delta.y < 0)
    );
  }
  stepForward(context: TimeState): void {
    const { position } = this.entity.transform;
    const { start, delta } = this;
    const { fractional } = position;
    const isAtTargetPosition = this.isAtTargetPosition(position, start, delta);
    const moveTime = getMoveTime();

    if (!isAtTargetPosition) {
      position.set(
        fractional.x + (delta.x / moveTime) * context.dt,
        fractional.y + (delta.y / moveTime) * context.dt,
        position.z
      );
    } else {
      position.x = start.x + delta.x;
      position.y = start.y + delta.y;
      this.progress = 1;
    }
  }
  stepBackward(context: TimeState): void {
    const { position } = this.entity.transform;
    const { start, delta } = this;
    const { fractional } = position;
    const isAtTargetPosition = this.isAtTargetPosition(position, start, delta);
    const moveTime = getMoveTime();

    if (!isAtTargetPosition) {
      position.set(
        fractional.x - (delta.x / moveTime) * context.dt,
        fractional.y - (delta.y / moveTime) * context.dt,
        position.z
      );
    } else {
      position.x = start.x;
      position.y = start.y;
      this.progress = -0;
    }
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
    readonly target: HeadingDirectionValue
  ) {
    super(entity);
    this.initial = entity.headingDirection;
  }
  getRotationIncrement(targetRads: number, currentRads: number, dt: number) {
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
    return ((targetRads - currentRads) * dt) / getTurnTime();
  }
  isAtTargetRotation(rotation: number, target: number) {
    return (
      // TODO this could probably be optimized/simplified
      Math.abs(rotation - target) < 0.01 ||
      Math.abs(
        normalizeAngle(rotation + Math.PI) - normalizeAngle(target + Math.PI)
      ) < 0.01
    );
  }
  stepForward(context: TimeState): void {
    const { rotation } = this.entity.transform;
    const targetRads = HeadingDirection.getRadians(this.target);
    const isAtTargetRotation = this.isAtTargetRotation(rotation.z, targetRads);

    if (!isAtTargetRotation) {
      let currentRads = rotation.z;
      currentRads = normalizeAngle(
        currentRads +
          this.getRotationIncrement(targetRads, currentRads, context.dt)
      );
      rotation.z = currentRads;
    } else {
      rotation.z = targetRads;
      this.progress = 1;
    }
  }

  stepBackward(context: TimeState): void {
    const { rotation } = this.entity.transform;
    const initialRads = HeadingDirection.getRadians(this.initial);
    const isAtTargetRotation = this.isAtTargetRotation(rotation.z, initialRads);

    if (!isAtTargetRotation) {
      let currentRads = rotation.z;
      currentRads = normalizeAngle(
        currentRads +
          this.getRotationIncrement(initialRads, currentRads, context.dt)
      );
      rotation.z = currentRads;
    } else {
      rotation.z = initialRads;
      this.progress = 0;
    }
  }
}

export class PushAction extends Action<
  ActionEntity<typeof TransformComponent>,
  TimeState
> {
  end = new Vector2();
  constructor(
    entity: ActionEntity<typeof TransformComponent>,
    readonly delta: Vector2
  ) {
    super(entity);
    const { end } = this;
    const { position } = this.entity.transform;
    end.set(position.x + delta.x, position.y + delta.y);
    this.effectedArea.push(end);
  }
  stepForward(): void {
    this.progress = 1;
  }

  stepBackward(): void {
    this.progress = 0;
  }
}

export class CreateEntityAction extends Action<
  ActionEntity<typeof TransformComponent>,
  EntityManagerState
> {
  #createdEntity?: any;
  constructor(
    entity: ActionEntity<typeof TransformComponent>,
    readonly prefab: IEntityPrefab<any>,
    readonly position: ReadonlyRecursive<Vector3>
  ) {
    super(entity);
    this.effectedArea.push(getTileVector(position));
  }
  stepForward(state: EntityManagerState) {
    const { prefab, position } = this;
    const createdEntity = prefab.create(state);
    if (TransformComponent.has(createdEntity)) {
      createdEntity.transform.position.copy(position);
    }
    ChangedTag.add(createdEntity);
    this.#createdEntity = createdEntity;
    this.progress = 1;
  }
  stepBackward(state: EntityManagerState) {
    const { prefab } = this;
    prefab.destroy(this.#createdEntity);
    state.removeEntity(this.#createdEntity);
    this.progress = 0;
  }
}

export class SetAnimationClipIndexAction extends Action<
  ActionEntity<typeof TransformComponent | typeof AnimationComponent>,
  {}
> {
  #previousClipIndex?: number;
  constructor(
    entity: ActionEntity<typeof TransformComponent | typeof AnimationComponent>,
    readonly clipIndex: number
  ) {
    super(entity);
  }
  stepForward() {
    const { animation } = this.entity;
    this.#previousClipIndex = animation.clipIndex;
    animation.clipIndex = this.clipIndex;
    this.progress = 1;
  }
  stepBackward(entity: ActionEntity<typeof AnimationComponent>) {
    entity.animation.clipIndex = this.#previousClipIndex!;
    this.progress = 0;
  }
}

export class ControlCameraAction extends Action<
  ActionEntity<typeof TransformComponent>,
  CameraState
> {
  stepForward(state: CameraState) {
    state.cameraController = {
      position: this.entity.transform.position
    };
    this.progress = 1;
  }
  stepBackward() {
    this.progress = 0;
  }
}

export class RemoveEntityAction extends Action<
  ActionEntity<typeof TransformComponent>,
  {}
> {
  constructor(
    entity: ActionEntity<typeof TransformComponent>,
    readonly entityToRemove: EntityWithComponents<any>
  ) {
    super(entity);
  }
  stepForward() {
    const { entityToRemove } = this;
    AddedTag.remove(entityToRemove);
    ChangedTag.add(entityToRemove);
    this.progress = 1;
  }
  stepBackward() {
    const { entityToRemove } = this;
    AddedTag.add(entityToRemove);
    ChangedTag.add(entityToRemove);
    this.progress = 0;
  }
}

export class WriteMessageAction extends Action<
  ActionEntity<never>,
  RendererState
> {
  canUndo = false;
  constructor(
    entity: ActionEntity<never>,
    readonly cursor: ITypewriterCursor,
    readonly message: string
  ) {
    super(entity);
  }
  stepForward() {
    this.cursor.writeAsync(this.message).then(() => {
      this.progress = 1;
    });
  }
  stepBackward() {
    console.warn("Not implemented");
    this.progress = 0;
  }
}

export class ClearMessagesAction extends Action<ActionEntity<never>, never> {
  canUndo = false;
  constructor(
    entity: ActionEntity<never>,
    readonly cursor: ITypewriterCursor
  ) {
    super(entity);
  }
  stepForward() {
    this.cursor.clear();
    this.progress = 1;
  }
  stepBackward() {
    console.warn("Not implemented");
    this.progress = 0;
  }
}

export class SetVisibilityAction extends Action<
  ActionEntity<typeof TransformComponent>,
  never
> {
  canUndo = false;
  constructor(
    entity: ActionEntity<typeof TransformComponent>,
    readonly visible: boolean
  ) {
    super(entity);
  }
  stepForward() {
    this.entity.transform.visible = this.visible;
    this.progress = 1;
  }
  stepBackward() {
    console.warn("Not implemented");
    this.progress = 0;
  }
}

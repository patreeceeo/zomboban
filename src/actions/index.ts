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
  stepForward(context: TimeState): void {
    const { position } = this.entity.transform;
    const { start, delta } = this;
    const { fractional } = position;
    const detalTime = context.dt;
    const moveTime = getMoveTime();

    this.progress += detalTime / moveTime;

    if (this.progress < 1) {
      position.set(
        fractional.x + (delta.x / moveTime) * detalTime,
        fractional.y + (delta.y / moveTime) * detalTime,
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
    const detalTime = context.dt;
    const moveTime = getMoveTime();

    this.progress -= detalTime / moveTime;

    if (this.progress > 0) {
      position.set(
        fractional.x - (delta.x / moveTime) * detalTime,
        fractional.y - (delta.y / moveTime) * detalTime,
        position.z
      );
    } else {
      position.x = start.x;
      position.y = start.y;
      this.progress = 0;
    }
  }
  toString(): string {
    const { delta } = this;
    return `Move by ${delta.x}, ${delta.y}`;
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
  getRotationIncrement(
    targetRads: number,
    currentRads: number,
    dt: number,
    totalTime: number
  ) {
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
    return ((targetRads - currentRads) * dt) / totalTime;
  }
  stepForward(context: TimeState): void {
    const { entity, target } = this;
    const { rotation } = entity.transform;
    const targetRads = HeadingDirection.getRadians(target);
    const detalTime = context.dt;
    const totalTime = getTurnTime();

    this.progress += detalTime / totalTime;

    if (this.progress < 1) {
      let currentRads = rotation.z;
      currentRads = normalizeAngle(
        currentRads +
          this.getRotationIncrement(
            targetRads,
            currentRads,
            detalTime,
            totalTime
          )
      );
      rotation.z = currentRads;
    } else {
      rotation.z = targetRads;
      entity.headingDirection = target;
      this.progress = 1;
    }
  }

  stepBackward(context: TimeState): void {
    const { entity, initial } = this;
    const { rotation } = this.entity.transform;
    const initialRads = HeadingDirection.getRadians(initial);
    const detalTime = context.dt;
    const totalTime = getTurnTime();

    this.progress -= detalTime / totalTime;

    if (this.progress > 0) {
      let currentRads = rotation.z;
      currentRads = normalizeAngle(
        currentRads +
          this.getRotationIncrement(
            initialRads,
            currentRads,
            detalTime,
            totalTime
          )
      );
      rotation.z = currentRads;
    } else {
      rotation.z = initialRads;
      entity.headingDirection = initial;
      this.progress = 0;
    }
  }
  toString(): string {
    return `Rotate to ${HeadingDirection.stringify(this.target)}`;
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
  toString(): string {
    const { end } = this;
    return `Push to ${end.x}, ${end.y}`;
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

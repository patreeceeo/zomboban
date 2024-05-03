import { EntityWithComponents } from "../Component";
import {
  CameraState,
  EntityManagerState,
  RendererState,
  TimeState
} from "../state";
import { Action } from "../systems/ActionSystem";
import {
  AddedTag,
  AnimationComponent,
  ChangedTag,
  HeadingDirection,
  TransformComponent
} from "../components";
import { Vector2, Vector3 } from "three";
import { convertToPixels, convertToTiles } from "../units/convert";
import { IEntityPrefab } from "../EntityManager";
import { ITypewriterCursor } from "../Typewriter";
import { normalizeAngle } from "../util";
import { invariant } from "../Error";

function getTileVector(position: { x: number; y: number }) {
  return new Vector2(convertToTiles(position.x), convertToTiles(position.y));
}

function getDirectionVector(
  direction: HeadingDirection,
  target = new Vector2()
) {
  switch (direction) {
    case HeadingDirection.Up:
      return target.set(0, convertToPixels(1 as Tile));
    case HeadingDirection.Down:
      return target.set(0, convertToPixels(-1 as Tile));
    case HeadingDirection.Left:
      return target.set(convertToPixels(-1 as Tile), 0);
    case HeadingDirection.Right:
      return target.set(convertToPixels(1 as Tile), 0);
    default:
      invariant(false, `Invalid direction: ${direction}`);
  }
}

declare const moveTimeInput: HTMLInputElement;
declare const turnTimeInput: HTMLInputElement;
function getMoveTime() {
  return parseInt(moveTimeInput.value);
}
function getTurnTime() {
  return parseInt(turnTimeInput.value);
}
export class MoveAction extends Action<
  EntityWithComponents<typeof TransformComponent>,
  TimeState
> {
  start = new Vector2();
  delta = new Vector2();
  end = new Vector2();
  constructor(
    direction: HeadingDirection,
    readonly rotate = false
  ) {
    super();
    getDirectionVector(direction, this.delta);
  }
  bind(entity: EntityWithComponents<typeof TransformComponent>) {
    const { start, end, delta } = this;
    const { position } = entity.transform;
    start.set(position.x, position.y);
    end.set(start.x + delta.x, start.y + delta.y);
  }
  getRotationIncrement(target: number, current: number, dt: number) {
    if (current === target) {
      return 0;
    }
    if (Math.abs(target - current) > Math.PI) {
      if (target > current) {
        current += Math.PI * 2;
      } else {
        target += Math.PI * 2;
      }
    }
    return ((target - current) * dt) / getTurnTime();
  }
  pi2 = Math.PI / 2;
  isAtTargetPosition(position: Vector3, end: Vector2, delta: Vector2) {
    return (
      (position.x >= end.x && delta.x > 0) ||
      (position.x <= end.x && delta.x < 0) ||
      (position.y >= end.y && delta.y > 0) ||
      (position.y <= end.y && delta.y < 0)
    );
  }
  getRotationTarget(delta: Vector2) {
    return normalizeAngle(Math.atan2(delta.y, delta.x) + this.pi2);
  }
  isAtTargetRotation(rotation: number, target: number) {
    return (
      Math.abs(rotation - target) < 0.01 ||
      Math.abs(
        normalizeAngle(rotation + Math.PI) - normalizeAngle(target + Math.PI)
      ) < 0.01
    );
  }
  stepForward(
    entity: EntityWithComponents<typeof TransformComponent>,
    context: TimeState
  ): void {
    const { position, rotation } = entity.transform;
    const { delta, end } = this;
    const { fractional } = position;
    const isAtTargetPosition = this.isAtTargetPosition(position, end, delta);
    const rotationTarget = this.getRotationTarget(delta);
    const isAtTargetRotation = this.isAtTargetRotation(
      rotation.z,
      rotationTarget
    );
    const moveTime = getMoveTime();
    if (!isAtTargetPosition) {
      position.set(
        fractional.x + (delta.x / moveTime) * context.dt,
        fractional.y + (delta.y / moveTime) * context.dt,
        position.z
      );
    }

    if (this.rotate) {
      let rotateScalar = rotation.z;
      rotateScalar = normalizeAngle(
        rotateScalar +
          this.getRotationIncrement(rotationTarget, rotateScalar, context.dt)
      );
      rotation.z = rotateScalar;
    }

    if (isAtTargetPosition && (isAtTargetRotation || !this.rotate)) {
      position.x = end.x;
      position.y = end.y;
      rotation.z = rotationTarget;
      this.progress = 1;
    }
  }

  stepBackward(
    entity: EntityWithComponents<typeof TransformComponent>,
    context: TimeState
  ): void {
    const { delta, start, pi2 } = this;
    const { position, rotation } = entity.transform;
    const { fractional } = position;
    const moveTime = getMoveTime();
    position.set(
      fractional.x - (delta.x / moveTime) * context!.dt,
      fractional.y - (delta.y / moveTime) * context!.dt,
      position.z
    );
    if (this.rotate) {
      let rotateScalar = rotation.z;
      const rotateScalarTarget = Math.atan2(-delta.y, -delta.x) + pi2;
      rotateScalar += this.getRotationIncrement(
        rotateScalarTarget,
        rotateScalar,
        context.dt
      );
      rotation.z = rotateScalar;
    }
    if (position.x <= start.x && delta.x > 0) {
      position.x = start.x;
      this.progress = 0;
    }
    if (position.x >= start.x && delta.x < 0) {
      position.x = start.x;
      this.progress = 0;
    }
    if (position.y <= start.y && delta.y > 0) {
      position.y = start.y;
      this.progress = 0;
    }
    if (position.y >= start.y && delta.y < 0) {
      position.y = start.y;
      this.progress = 0;
    }
  }
}

export class PushAction extends Action<
  EntityWithComponents<typeof TransformComponent>,
  TimeState
> {
  start = new Vector2();
  delta = new Vector2();
  end = new Vector2();
  constructor(direction: HeadingDirection) {
    super();
    getDirectionVector(direction, this.delta);
  }
  bind(entity: EntityWithComponents<typeof TransformComponent>) {
    const { start, end, delta } = this;
    const { position } = entity.transform;
    start.set(position.x, position.y);
    end.set(start.x + delta.x, start.y + delta.y);

    // assume that `end` is only 1 tile away from `start`
    this.effectedArea.push(getTileVector(end));
  }
  stepForward(): void {
    this.progress = 1;
  }

  stepBackward(): void {
    this.progress = 0;
  }
}

export class CreateEntityAction extends Action<
  EntityWithComponents<typeof TransformComponent>,
  EntityManagerState
> {
  #createdEntity?: any;
  constructor(
    readonly prefab: IEntityPrefab<any>,
    readonly position: ReadonlyRecursive<Vector3>
  ) {
    super();
    this.effectedArea.push(getTileVector(position));
  }
  bind() {}
  stepForward(
    entity: EntityWithComponents<typeof TransformComponent>,
    state: EntityManagerState
  ) {
    void entity;
    const { prefab, position } = this;
    const createdEntity = prefab.create(state);
    if (TransformComponent.has(createdEntity)) {
      createdEntity.transform.position.copy(position);
    }
    ChangedTag.add(createdEntity);
    this.#createdEntity = createdEntity;
    this.progress = 1;
  }
  stepBackward(
    entity: EntityWithComponents<typeof TransformComponent>,
    state: EntityManagerState
  ) {
    void entity;
    const { prefab } = this;
    prefab.destroy(this.#createdEntity);
    state.removeEntity(this.#createdEntity);
    this.progress = 0;
  }
}

export class SetAnimationClipIndexAction extends Action<
  EntityWithComponents<typeof AnimationComponent>,
  {}
> {
  #previousClipIndex?: number;
  constructor(readonly clipIndex: number) {
    super();
  }
  bind() {}
  stepForward(entity: EntityWithComponents<typeof AnimationComponent>) {
    this.#previousClipIndex = entity.animation.clipIndex;
    entity.animation.clipIndex = this.clipIndex;
    this.progress = 1;
  }
  stepBackward(entity: EntityWithComponents<typeof AnimationComponent>) {
    entity.animation.clipIndex = this.#previousClipIndex!;
    this.progress = 0;
  }
}

export class ControlCameraAction extends Action<
  EntityWithComponents<typeof TransformComponent>,
  CameraState
> {
  bind() {}
  stepForward(
    entity: EntityWithComponents<typeof TransformComponent>,
    state: CameraState
  ) {
    state.cameraController = {
      position: entity.transform.position
    };
    this.progress = 1;
  }
  stepBackward(_entity: EntityWithComponents<typeof TransformComponent>) {
    this.progress = 0;
  }
}

export class BillboardAction extends Action<
  EntityWithComponents<typeof TransformComponent>,
  CameraState
> {
  bind() {}
  stepForward(
    entity: EntityWithComponents<typeof TransformComponent>,
    state: CameraState
  ) {
    const { rotation: cameraRotation } = state.camera;
    const { rotation: entityRotation } = entity.transform;
    entityRotation.copy(cameraRotation);
    // TODO calculate where the line of sight from the camera intersects with the ground plane and store result in entityPosition?
    this.progress = 1;
  }
  stepBackward(_entity: EntityWithComponents<typeof TransformComponent>) {
    console.warn("Not implemented");
    this.progress = 0;
  }
}

export class RemoveEntityAction extends Action<
  EntityWithComponents<typeof TransformComponent>,
  {}
> {
  constructor(readonly entities: Iterable<any>) {
    super();
  }
  bind() {}
  stepForward() {
    for (const entity of this.entities) {
      AddedTag.remove(entity);
      ChangedTag.add(entity);
    }
    this.progress = 1;
  }
  stepBackward() {
    for (const entity of this.entities) {
      AddedTag.add(entity);
      ChangedTag.add(entity);
    }
    this.progress = 0;
  }
}

export class WriteMessageAction extends Action<
  EntityWithComponents<typeof TransformComponent>,
  RendererState
> {
  canUndo = false;
  constructor(
    readonly cursor: ITypewriterCursor,
    readonly message: string
  ) {
    super();
  }
  bind() {}
  stepForward(_entity: EntityWithComponents<typeof TransformComponent>) {
    this.cursor.writeAsync(this.message).then(() => {
      this.progress = 1;
    });
  }
  stepBackward() {
    console.warn("Not implemented");
    this.progress = 0;
  }
}

export class ClearMessagesAction extends Action<
  EntityWithComponents<typeof TransformComponent>,
  {}
> {
  canUndo = false;
  constructor(readonly cursor: ITypewriterCursor) {
    super();
  }
  bind() {}
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
  EntityWithComponents<typeof TransformComponent>,
  {}
> {
  canUndo = false;
  entities: EntityWithComponents<typeof TransformComponent>[];
  constructor(
    readonly visible: boolean,
    ...entities: EntityWithComponents<typeof TransformComponent>[]
  ) {
    super();
    this.entities = entities;
  }
  bind() {}
  stepForward() {
    for (const entity of this.entities) {
      entity.transform.visible = this.visible;
    }
    this.progress = 1;
  }
  stepBackward() {
    console.warn("Not implemented");
    this.progress = 0;
  }
}

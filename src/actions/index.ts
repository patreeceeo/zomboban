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
import { IEntityPrefab } from "../EntityManager";
import { ITypewriterCursor } from "../Typewriter";
import { HeadingDirection, HeadingDirectionValue } from "../HeadingDirection";
import { EntityWithComponents } from "../Component";

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
    startTime: number,
    headingDirection: HeadingDirectionValue
  ) {
    super(entity, startTime, getMoveTime());
    const { start, delta } = this;
    const { position } = entity.transform;
    HeadingDirection.getVector(headingDirection, delta);
    start.copy(position);
  }
  update(): void {
    const { position } = this.entity.transform;
    const { delta, progress, start } = this;

    position.set(
      start.x + delta.x * progress,
      start.y + delta.y * progress,
      position.z
    );
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
    } else {
      entity.headingDirection = initial;
    }
  }
  toString(): string {
    return `Rotate ${HeadingDirection.stringify(this.target)}`;
  }
}

export class PushAction extends Action<
  ActionEntity<typeof TransformComponent>,
  TimeState
> {
  constructor(
    entity: ActionEntity<typeof TransformComponent>,
    startTime: number,
    readonly delta: Vector2
  ) {
    super(entity, startTime, 0);
    const { position } = this.entity.transform;
    this.addEffectedTile(position.x + delta.x, position.y + delta.y);
  }
  update() {}
  toString(): string {
    const [end] = this.listEffectedTiles();
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
    startTime: number,
    readonly prefab: IEntityPrefab<any>,
    readonly position: ReadonlyRecursive<Vector3>
  ) {
    super(entity, startTime, 0);
    this.addEffectedTile(position.x, position.y);
  }
  update(state: EntityManagerState) {
    const { prefab, position } = this;
    if (this.progress > 0) {
      const createdEntity = prefab.create(state);
      if (TransformComponent.has(createdEntity)) {
        createdEntity.transform.position.copy(position);
      }
      ChangedTag.add(createdEntity);
      this.#createdEntity = createdEntity;
    } else {
      prefab.destroy(this.#createdEntity);
      state.removeEntity(this.#createdEntity);
    }
  }
}

export class SetAnimationClipIndexAction extends Action<
  ActionEntity<typeof TransformComponent | typeof AnimationComponent>,
  {}
> {
  #previousClipIndex?: number;
  constructor(
    entity: ActionEntity<typeof TransformComponent | typeof AnimationComponent>,
    startTime: number,
    readonly clipIndex: number
  ) {
    super(entity, startTime, 0);
  }
  update() {
    const { animation } = this.entity;
    if (this.progress > 0) {
      this.#previousClipIndex = animation.clipIndex;
      animation.clipIndex = this.clipIndex;
    } else {
      animation.clipIndex = this.#previousClipIndex!;
    }
  }
}

export class ControlCameraAction extends Action<
  ActionEntity<typeof TransformComponent>,
  CameraState
> {
  constructor(
    entity: ActionEntity<typeof TransformComponent>,
    startTime: number
  ) {
    super(entity, startTime, 0);
  }
  update(state: CameraState) {
    if (this.progress > 0) {
      state.cameraController = {
        position: this.entity.transform.position
      };
    }
  }
}

export class RemoveEntityAction extends Action<
  ActionEntity<typeof TransformComponent>,
  {}
> {
  constructor(
    entity: ActionEntity<typeof TransformComponent>,
    startTime: number,
    readonly entityToRemove: EntityWithComponents<any>
  ) {
    super(entity, startTime, 0);
  }
  update() {
    const { entityToRemove } = this;
    if (this.progress > 0) {
      AddedTag.remove(entityToRemove);
      ChangedTag.add(entityToRemove);
    } else {
      AddedTag.add(entityToRemove);
      ChangedTag.add(entityToRemove);
    }
  }
}

export class WriteMessageAction extends Action<
  ActionEntity<never>,
  RendererState
> {
  canUndo = false;
  constructor(
    entity: ActionEntity<never>,
    startTime: number,
    readonly cursor: ITypewriterCursor,
    readonly message: string
  ) {
    super(entity, startTime, 0);
  }
  update() {
    if (this.progress > 0) {
      this.cursor.writeAsync(this.message);
    } else {
      console.warn("Not implemented");
    }
  }
}

export class ClearMessagesAction extends Action<ActionEntity<never>, never> {
  canUndo = false;
  constructor(
    entity: ActionEntity<never>,
    startTime: number,
    readonly cursor: ITypewriterCursor
  ) {
    super(entity, startTime, 0);
  }
  update() {
    if (this.progress > 0) {
      this.cursor.clear();
    } else {
      console.warn("Not implemented");
    }
  }
}

export class SetVisibilityAction extends Action<
  ActionEntity<typeof TransformComponent>,
  never
> {
  canUndo = false;
  constructor(
    entity: ActionEntity<typeof TransformComponent>,
    startTime: number,
    readonly visible: boolean
  ) {
    super(entity, startTime, 0);
  }
  update() {
    if (this.progress > 0) {
      this.entity.transform.visible = this.visible;
    } else {
      console.warn("Not implemented");
    }
  }
}

export class KillPlayerAction extends Action<
  ActionEntity<typeof TransformComponent>,
  never
> {
  constructor(
    entity: ActionEntity<typeof TransformComponent>,
    startTime: number
  ) {
    super(entity, startTime, 0);
  }
  canUndo = false;
  update() {}
}

export class PlayerWinAction extends Action<
  ActionEntity<typeof TransformComponent>,
  never
> {
  constructor(
    entity: ActionEntity<typeof TransformComponent>,
    startTime: number
  ) {
    super(entity, startTime, 0);
  }
  canUndo = false;
  update() {}
}

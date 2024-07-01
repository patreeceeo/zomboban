import {
  CameraState,
  EntityManagerState,
  RendererState,
  TimeState
} from "../state";
import { Action } from "../Action";
import { ActionEntity } from "../systems/ActionSystem";
import {
  AddedTag,
  AnimationComponent,
  ChangedTag,
  HeadingDirectionComponent,
  TransformComponent
} from "../components";
import { Vector3 } from "three";
import { IEntityPrefab } from "../EntityManager";
import { ITypewriterCursor } from "../Typewriter";
import { HeadingDirection, HeadingDirectionValue } from "../HeadingDirection";
import { EntityWithComponents } from "../Component";
import { removeElementByIdSafely } from "../UIElement";
import { afterDOMContentLoaded } from "../util";

declare const moveTimeInput: HTMLInputElement;
function getMoveTimeFromInput() {
  return parseInt(moveTimeInput.value);
}
declare const turnTimeInput: HTMLInputElement;
function getTurnTimeFromInput() {
  return parseInt(turnTimeInput.value);
}

const getMoveTime =
  process.env.NODE_ENV === "development" ? getMoveTimeFromInput : () => 200;
const getTurnTime =
  process.env.NODE_ENV === "development" ? getTurnTimeFromInput : () => 30;

if (globalThis.document !== undefined) {
  afterDOMContentLoaded(() => {
    if (process.env.NODE_ENV !== "development") {
      removeElementByIdSafely("devVarsForm");
    }
  });
}

export class MoveAction<
  Entity extends ActionEntity<typeof TransformComponent>
> extends Action<Entity, TimeState> {
  readonly start = new Vector3();
  readonly delta = new Vector3();
  constructor(entity: Entity, startTime: number, delta: Vector3) {
    super(entity, startTime, getMoveTime());
    const { start } = this;
    const { position } = entity.transform;
    start.copy(position);
    this.delta.copy(delta);
  }
  update(): void {
    const { entity, delta, progress, start } = this;
    const { transform } = entity;
    const { position } = transform;

    position.set(
      start.x + delta.x * progress,
      start.y + delta.y * progress,
      position.z
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
    } else {
      entity.headingDirection = initial;
    }
  }
  humanName = "Rotate";
  toString(): string {
    return `${super.toString()} direction: ${HeadingDirection.stringify(this.target)}`;
  }
}

export class CreateEntityAction<
  Entity extends ActionEntity<typeof TransformComponent>
> extends Action<Entity, EntityManagerState> {
  #createdEntity?: any;
  constructor(
    entity: Entity,
    startTime: number,
    readonly prefab: IEntityPrefab<any>,
    readonly position: ReadonlyRecursive<Vector3>
  ) {
    super(entity, startTime, 0);
  }
  update(state: EntityManagerState) {
    const { prefab, position } = this;
    // TODO Maybe polymorphism instead of this conditional?
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

export class SetAnimationClipIndexAction<
  Entity extends ActionEntity<
    typeof TransformComponent | typeof AnimationComponent
  >
> extends Action<Entity, {}> {
  #previousClipIndex?: number;
  constructor(
    entity: Entity,
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

export class ControlCameraAction<
  Entity extends ActionEntity<typeof TransformComponent>
> extends Action<Entity, CameraState> {
  canUndo = false;
  constructor(entity: Entity, startTime: number) {
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

export class RemoveEntityAction<
  Entity extends ActionEntity<typeof TransformComponent>
> extends Action<Entity, {}> {
  constructor(
    entity: Entity,
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

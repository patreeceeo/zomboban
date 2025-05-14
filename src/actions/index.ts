import {
  CameraState,
  EntityManagerState,
  MetaState,
  TimeState,
  ClientState
} from "../state";
import { Action } from "../Action";
import { ActionEntity } from "../systems/ActionSystem";
import {
  AnimationComponent,
  BehaviorComponent,
  ChangedTag,
  HeadingDirectionComponent,
  ToggleableComponent,
  TransformComponent,
  CanDeleteTag,
  LevelIdComponent,
  ServerIdComponent
} from "../components";
import { Vector3 } from "three";
import { IEntityPrefab } from "../EntityPrefab";
import { HeadingDirection, HeadingDirectionValue } from "../HeadingDirection";
import { EntityWithComponents, IComponentDefinition } from "../Component";
import { log } from "../util";
import { convertToPixels } from "../units/convert";
import { AnimationJson } from "../Animation";
import { LogLevel } from "../Log";
import { BehaviorEnum } from "../behaviors";

export const getMoveTime = () => 200;
const getTurnTime = () => 30;

export class MoveAction<
  Entity extends ActionEntity<typeof TransformComponent>
> extends Action<Entity, TimeState> {
  readonly start = new Vector3();
  readonly delta = new Vector3();
  constructor(entity: Entity, startTime: number, deltaTiles: Vector3) {
    super(entity, startTime, getMoveTime());
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
    return `${super.toString()} direction: ${HeadingDirection.stringify(
      this.target
    )}`;
  }
}

export class CreateEntityAction<
  Entity extends ActionEntity<typeof TransformComponent>
> extends Action<Entity, EntityManagerState & ClientState & MetaState> {
  #createdEntity?: any;
  constructor(
    entity: Entity,
    startTime: number,
    readonly prefab: IEntityPrefab<any>,
    readonly position: ReadonlyRecursive<Vector3>,
    readonly persistent: boolean = false
  ) {
    super(entity, startTime, 0);
  }
  update(state: EntityManagerState & ClientState & MetaState) {
    const { prefab, position } = this;
    // TODO Maybe polymorphism instead of this conditional?
    if (this.progress > 0) {
      const createdEntity = prefab.create(state);
      const hasTransform = TransformComponent.has(createdEntity);
      const hasBehavior = BehaviorComponent.has(createdEntity);
      if (hasTransform) {
        const { position: createdEntityPosition } = createdEntity.transform;
        createdEntityPosition.copy(position);

        // TODO remove once the cursor can be moved along Z axis
        if (
          hasBehavior &&
          createdEntity.behaviorId === BehaviorEnum.ToggleButton
        ) {
          createdEntityPosition.z -= convertToPixels(1 as Tiles);
        }
      }
      ChangedTag.add(createdEntity);
      LevelIdComponent.add(createdEntity, { levelId: state.currentLevelId });
      this.#createdEntity = createdEntity;

      if (this.persistent) {
        // TODO handle the response?
        state.client.postEntity(createdEntity);
      }
    } else {
      // TODO why not use CanDeleteTag?
      prefab.destroy(this.#createdEntity);
      state.removeEntity(this.#createdEntity);
      if(this.persistent && ServerIdComponent.has(this.#createdEntity)) {
        // TODO handle the response?
        state.client.deleteEntity(this.#createdEntity);
      }
    }
  }
}


export class RemoveEntitiesAction<
  Entity extends ActionEntity<typeof TransformComponent>
> extends Action<Entity, ClientState> {
  constructor(
    entity: Entity,
    startTime: number,
    readonly entities: Iterable<EntityWithComponents<any>>,
    readonly persistent: boolean = false
  ) {
    super(entity, startTime, 0);
  }
  update(state: ClientState) {
    const { entities } = this;
    if (this.progress > 0) {
      for (const ntt of entities) {
        CanDeleteTag.add(ntt);
        if (this.persistent && ServerIdComponent.has(ntt)) {
          // TODO handle the response?
          state.client.deleteEntity(ntt);
        }
      }
    } else {
      for (const ntt of entities) {
        CanDeleteTag.remove(ntt);
        if (this.persistent && ServerIdComponent.has(ntt)) {
          // TODO handle the response?
          state.client.postEntity(ntt);
        }
      }
    }
  }
}

export class SetAnimationClipAction<
  Entity extends ActionEntity<
    typeof TransformComponent | typeof AnimationComponent
  >
> extends Action<Entity, {}> {
  #previousClipIndex?: number;
  constructor(
    entity: Entity,
    startTime: number,
    readonly clipName: string
  ) {
    super(entity, startTime, 0);
  }
  update() {
    const { animation } = this.entity;
    if (this.progress > 0) {
      this.#previousClipIndex = animation.clipIndex;
      animation.clipIndex = AnimationJson.indexOfClip(animation, this.clipName);
      log.append(
        `Set animation clip to ${this.clipName}`,
        LogLevel.Normal,
        this,
        this.entity
      );
    } else {
      animation.clipIndex = this.#previousClipIndex!;
    }
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

export class TagAction extends Action<ActionEntity<any>, never> {
  constructor(
    entity: ActionEntity<typeof TransformComponent>,
    startTime: number,
    readonly Tag: IComponentDefinition
  ) {
    super(entity, startTime, 0);
  }
  update(_context: never): void {}
  onStart(context: never): void {
    super.onStart(context);
    this.Tag.add(this.entity);
  }
}

export class UntagAction extends Action<ActionEntity<any>, never> {
  constructor(
    entity: ActionEntity<typeof TransformComponent>,
    startTime: number,
    readonly Tag: IComponentDefinition
  ) {
    super(entity, startTime, 0);
  }
  update(_context: never): void {}
  onComplete(context: never): void {
    super.onComplete(context);
    this.Tag.remove(this.entity);
  }
}

export class ToggleAction extends Action<
  ActionEntity<typeof ToggleableComponent>,
  never
> {
  constructor(
    entity: ActionEntity<typeof ToggleableComponent>,
    startTime: number
  ) {
    super(entity, startTime, 0);
  }
  update(_context: never): void {
    const { entity } = this;
    if (this.progress > 0) {
      entity.toggleState = !entity.toggleState;
    }
  }
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

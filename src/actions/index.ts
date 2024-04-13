import { EntityWithComponents, IComponentDefinition } from "../Component";
import {
  CameraState,
  EntityManagerState,
  RendererState,
  TimeState
} from "../state";
import { Action } from "../systems/ActionSystem";
import { AnimationComponent, TransformComponent } from "../components";
import { Vector2, Vector3 } from "three";
import { convertToPixels, convertToTiles } from "../units/convert";
import { IEntityPrefab } from "../EntityManager";
import { ITypewriterCursor } from "../Typewriter";

function getTileVector(position: { x: number; y: number }) {
  return new Vector2(convertToTiles(position.x), convertToTiles(position.y));
}

export class MoveAction extends Action<
  EntityWithComponents<typeof TransformComponent>,
  TimeState
> {
  start = new Vector3();
  delta = new Vector3();
  end = new Vector3();
  constructor(
    deltaX: Tile,
    deltaY: Tile,
    readonly rotate = false
  ) {
    super();
    this.delta.set(convertToPixels(deltaX), convertToPixels(deltaY), 0);
  }
  bind(entity: EntityWithComponents<typeof TransformComponent>) {
    const { start, end, delta } = this;
    const { position } = entity.transform;
    start.set(position.x, position.y, 0);
    end.set(start.x + delta.x, start.y + delta.y, 0);
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
    return (target - current) * dt * 0.03;
  }
  pi2 = Math.PI / 2;
  stepForward(
    entity: EntityWithComponents<typeof TransformComponent>,
    context: TimeState
  ): void {
    const { position, rotation } = entity.transform;
    const { delta, end } = this;
    const { fractional } = position;
    const { pi2 } = this;
    position.set(
      fractional.x + (delta.x / 200) * context.dt,
      fractional.y + (delta.y / 200) * context.dt,
      position.z
    );
    if (this.rotate) {
      let rotateScalar = rotation.z;
      const rotateScalarTarget = Math.atan2(delta.y, delta.x) + pi2;
      rotateScalar += this.getRotationIncrement(
        rotateScalarTarget,
        rotateScalar,
        context.dt
      );
      rotation.z = rotateScalar;
    }

    if (position.x >= end.x && delta.x > 0) {
      position.x = end.x;
      this.progress = 1;
    }
    if (position.x <= end.x && delta.x < 0) {
      position.x = end.x;
      this.progress = 1;
    }
    if (position.y >= end.y && delta.y > 0) {
      position.y = end.y;
      this.progress = 1;
    }
    if (position.y <= this.end.y && delta.y < 0) {
      position.y = end.y;
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
    position.set(
      fractional.x - (delta.x / 200) * context!.dt,
      fractional.y - (delta.y / 200) * context!.dt,
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
  constructor(deltaX: Tile, deltaY: Tile) {
    super();
    this.delta.set(convertToPixels(deltaX), convertToPixels(deltaY));
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
    state.cameraController = entity.transform;
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

export class RemoveTagAction extends Action<
  EntityWithComponents<typeof TransformComponent>,
  {}
> {
  constructor(
    readonly Tag: IComponentDefinition<any>,
    readonly entities: Iterable<any>
  ) {
    super();
  }
  bind() {}
  stepForward() {
    for (const entity of this.entities) {
      this.Tag.remove(entity);
    }
    this.progress = 1;
  }
  stepBackward() {
    for (const entity of this.entities) {
      this.Tag.add(entity);
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
  stepForward(
    _entity: EntityWithComponents<typeof TransformComponent>,
    state: RendererState
  ) {
    this.cursor.write(this.message);
    // TODO: this.
    state.forceRender = true;
    this.progress = 1;
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

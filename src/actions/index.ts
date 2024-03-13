import { EntityWithComponents } from "../Component";
import { CameraState, EntityManagerState, TimeState } from "../state";
import { Action } from "../systems/ActionSystem";
import { SpriteComponent2 } from "../components";
import { Vector2, Vector3 } from "three";
import { convertToPixels, convertToTiles } from "../units/convert";
import { IEntityPrefab } from "../EntityManager";

function getTileVector(position: { x: number; y: number }) {
  return new Vector2(convertToTiles(position.x), convertToTiles(position.y));
}

export class MoveAction extends Action<
  EntityWithComponents<typeof SpriteComponent2>,
  TimeState
> {
  start = new Vector2();
  delta = new Vector2();
  end = new Vector2();
  constructor(deltaX: Tile, deltaY: Tile) {
    super();
    this.delta.set(convertToPixels(deltaX), convertToPixels(deltaY));
  }
  bind(entity: EntityWithComponents<typeof SpriteComponent2>) {
    const { start, end, delta } = this;
    const { position } = entity!;
    start.set(position.x, position.y);
    end.set(start.x + delta.x, start.y + delta.y);

    // assume that `end` is only 1 tile away from `start`
    this.effectedArea.push(getTileVector(end));
  }
  stepForward(
    entity: EntityWithComponents<typeof SpriteComponent2>,
    context: TimeState
  ): void {
    const { position } = entity!;
    const { delta, end } = this;
    position.set(
      position.x + (delta.x / 200) * context!.dt,
      position.y + (delta.y / 200) * context!.dt,
      position.z
    );
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
    entity: EntityWithComponents<typeof SpriteComponent2>,
    context: TimeState
  ): void {
    const { delta, start } = this;
    const { position } = entity!;
    position.set(
      position.x - (delta.x / 200) * context!.dt,
      position.y - (delta.y / 200) * context!.dt,
      position.z
    );
    if (position.x <= start.x && delta.x > 0) {
      position.x = start.x;
      this.progress = 1;
    }
    if (position.x >= start.x && delta.x < 0) {
      position.x = start.x;
      this.progress = 1;
    }
    if (position.y <= start.y && delta.y > 0) {
      position.y = start.y;
      this.progress = 1;
    }
    if (position.y >= start.y && delta.y < 0) {
      position.y = start.y;
      this.progress = 1;
    }
  }
}

export class CreateEntityAction extends Action<
  EntityWithComponents<typeof SpriteComponent2>,
  EntityManagerState
> {
  #createdEntity?: any;
  constructor(
    readonly prefab: IEntityPrefab<any, any>,
    readonly position: ReadonlyRecursive<Vector3>
  ) {
    super();
    this.effectedArea.push(getTileVector(position));
  }
  bind() {}
  stepForward(
    entity: EntityWithComponents<typeof SpriteComponent2>,
    state: EntityManagerState
  ) {
    void entity;
    const { prefab, position } = this;
    const createdEntity = prefab.create(state);
    createdEntity.position.copy(position);
    this.#createdEntity = createdEntity;
    this.progress = 1;
  }
  stepBackward(
    entity: EntityWithComponents<typeof SpriteComponent2>,
    state: EntityManagerState
  ) {
    void entity;
    const { prefab } = this;
    prefab.destroy(this.#createdEntity);
    state.removeEntity(this.#createdEntity);
    this.progress = 1;
  }
}

export class SetAnimationClipIndexAction extends Action<
  EntityWithComponents<typeof SpriteComponent2>,
  {}
> {
  constructor(readonly clipIndex: number) {
    super();
  }
  bind() {}
  stepForward(entity: EntityWithComponents<typeof SpriteComponent2>) {
    entity!.animation.clipIndex = this.clipIndex;
    this.progress = 1;
  }
  stepBackward(_entity: EntityWithComponents<typeof SpriteComponent2>) {
    throw "not implemented!";
  }
}

export class ControlCameraAction extends Action<
  EntityWithComponents<typeof SpriteComponent2>,
  CameraState
> {
  bind() {}
  stepForward(
    entity: EntityWithComponents<typeof SpriteComponent2>,
    state: CameraState
  ) {
    state.cameraController = entity;
    this.progress = 1;
  }
  stepBackward(
    _entity: EntityWithComponents<typeof SpriteComponent2>,
    state: CameraState
  ) {
    state.cameraController = undefined;
    this.progress = 1;
  }
}

import { Vector3, Sprite } from "three";
import { World } from "./EntityManager";
import test from "node:test";
import assert from "node:assert";
import { getMock } from "./testHelpers";

// TODO factor out tests for observables and make these tests focused on the EntityManager/World

interface IHasTexture {
  textureId: string;
}

interface IMaybeVisible {
  visible: boolean;
}

interface IHasSprite {
  readonly sprite: Sprite;
}

interface IPositionable {
  readonly position: Vector3;
}

interface IMovable {
  readonly velocity: Vector3;
}

interface ISpawnable {
  spawned: boolean;
}

interface IActor {
  behaviorId: string;
}

interface ISerializable<Data> {
  serialize(): Data;
  deserialize(data: Data): void;
}

interface ISpriteEntityJSON
  extends IHasTexture,
    IMaybeVisible,
    IPositionable,
    IMovable,
    ISpawnable,
    IActor {}

class SpriteEntity implements IHasSprite, ISerializable<ISpriteEntityJSON> {
  spawned = false;
  readonly sprite = new Sprite();
  readonly position = this.sprite.position;
  get visible() {
    return this.sprite.visible;
  }
  set visible(value: boolean) {
    this.sprite.visible = value;
  }
  velocity = new Vector3();
  behaviorId = "behavior/null";
  textureId = "texture/null";

  constructor(readonly name: string) {}

  serialize() {
    return {
      name: this.name,
      position: this.position,
      visible: this.visible,
      velocity: this.velocity,
      spawned: this.spawned,
      behaviorId: this.behaviorId,
      textureId: this.textureId
    };
  }
  deserialize(data: ISpriteEntityJSON) {
    this.position.copy(data.position);
    this.visible = data.visible;
    this.velocity.copy(data.velocity);
    this.spawned = data.spawned;
    this.behaviorId = data.behaviorId;
    this.textureId = data.textureId;
    // TODO look up texture by id and update the sprite's material
  }
}

test("adding entities", () => {
  const world = new World();
  const addEntitySpy = test.mock.fn();
  const addEntityMock = getMock(addEntitySpy);
  world.entities.onAdd(addEntitySpy);
  const entity = world.addEntity(() => new SpriteEntity("mario") as any);

  assert.equal(addEntityMock.calls.length, 1);
  assert.equal(addEntityMock.calls[0].arguments[0], entity);
});

test("removing entities", () => {
  const world = new World();
  const removeEntitySpy = test.mock.fn();
  const removeEntityMock = getMock(removeEntitySpy);
  world.entities.onRemove(removeEntitySpy);
  const entity = world.addEntity(() => new SpriteEntity("mario") as any);
  world.removeEntity(entity);

  assert.equal(removeEntityMock.calls.length, 1);
  assert.equal(removeEntityMock.calls[0].arguments[0], entity);
});

test("stream entities that have been or will be added", () => {
  const state = new World();
  const addEntitySpy = test.mock.fn();
  const addEntityMock = getMock(addEntitySpy);
  const entity = state.addEntity(() => new SpriteEntity("mario") as any);
  state.entities.stream(addEntitySpy);
  assert.equal(addEntityMock.calls.length, 1);
  assert.equal(addEntityMock.calls[0].arguments[0], entity);
});

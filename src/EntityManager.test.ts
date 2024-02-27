import { Vector3, Sprite } from "three";
import { IEntity, World } from "./EntityManager";
import test from "node:test";
import assert from "node:assert";
import { getMock } from "./testHelpers";
import {
  IReadonlyObservableCollection,
  ObserableCollection,
} from "./Observable";

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

interface ISerializable<Data extends IEntity> {
  serialize(): Data;
  deserialize(data: Data): void;
}

interface ISpriteEntityJSON
  extends IEntity,
    IHasTexture,
    IMaybeVisible,
    IPositionable,
    IMovable,
    ISpawnable,
    IActor {}

class SpriteEntity implements IHasSprite, ISerializable<ISpriteEntityJSON> {
  static create(data?: ISpriteEntityJSON) {
    const entity = new SpriteEntity(data?.name ?? "sprite");
    if (data) {
      entity.deserialize(data);
    }
    return entity;
  }
  static isInstance(entity: IEntity): entity is SpriteEntity {
    return entity instanceof SpriteEntity;
  }
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
      textureId: this.textureId,
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

export class State extends World {
  #sprites = new ObserableCollection<SpriteEntity>();

  get sprites() {
    return this.#sprites as IReadonlyObservableCollection<IMovable>;
  }

  constructor() {
    super();
    this.entities.onAdd((entity) => {
      if (SpriteEntity.isInstance(entity)) {
        this.#sprites.add(entity as SpriteEntity);
      }
    });
    this.entities.onRemove((entity) => {
      if (SpriteEntity.isInstance(entity)) {
        this.#sprites.remove(entity as SpriteEntity);
      }
    });
  }
}

test("adding entities", () => {
  const state = new State();
  const addEntitySpy = test.mock.fn();
  const addEntityMock = getMock(addEntitySpy);
  const addSpriteSpy = test.mock.fn();
  const addSpriteMock = getMock(addSpriteSpy);
  state.entities.onAdd(addEntitySpy);
  state.sprites.onAdd(addSpriteSpy);
  const entity = state.addEntity(SpriteEntity);

  assert.equal(addEntityMock.calls.length, 1);
  assert.equal(addSpriteMock.calls.length, 1);
  assert.equal(addEntityMock.calls[0].arguments[0], entity);
  assert.equal(addSpriteMock.calls[0].arguments[0], entity);
});

test("removing entities", () => {
  const state = new State();
  const removeEntitySpy = test.mock.fn();
  const removeEntityMock = getMock(removeEntitySpy);
  const removeSpriteSpy = test.mock.fn();
  const removeSpriteMock = getMock(removeSpriteSpy);
  state.entities.onRemove(removeEntitySpy);
  state.sprites.onRemove(removeSpriteSpy);
  const entity = state.addEntity(SpriteEntity);
  state.removeEntity(entity);

  assert.equal(removeEntityMock.calls.length, 1);
  assert.equal(removeSpriteMock.calls.length, 1);
  assert.equal(removeEntityMock.calls[0].arguments[0], entity);
  assert.equal(removeSpriteMock.calls[0].arguments[0], entity);
});

test("adding serialized entities", () => {
  const state = new State();
  const entity = state.addEntity(SpriteEntity, {
    name: "sprite1",
    spawned: true,
    position: new Vector3(1, 2, 3),
    visible: false,
    velocity: new Vector3(4, 5, 6),
    behaviorId: "behavior/1",
    textureId: "texture/1",
  });

  assert.equal(entity.name, "sprite1");
  assert.equal(entity.spawned, true);
  assert.equal(entity.position.x, 1);
  assert.equal(entity.position.y, 2);
  assert.equal(entity.position.z, 3);
  assert.equal(entity.visible, false);
  assert.equal(entity.velocity.x, 4);
  assert.equal(entity.velocity.y, 5);
  assert.equal(entity.velocity.z, 6);
  assert.equal(entity.behaviorId, "behavior/1");
  assert.equal(entity.textureId, "texture/1");
});

test("stream entities that have been or will be added", () => {
  const state = new State();
  const addEntitySpy = test.mock.fn();
  const addEntityMock = getMock(addEntitySpy);
  const entity = state.addEntity(SpriteEntity);
  state.entities.stream(addEntitySpy);
  assert.equal(addEntityMock.calls.length, 1);
  assert.equal(addEntityMock.calls[0].arguments[0], entity);
});

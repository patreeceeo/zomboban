import test from "node:test";
import assert from "node:assert";
import {
  HasComponent,
  ObjectArrayComponent,
  PrimativeArrayComponent,
  defineComponent,
} from "./Component";
import { Sprite, Vector3 } from "three";
import { getMock } from "./testHelpers";
import { IEntity } from "./EntityManager";

class BaseEntity implements IEntity {
  name = "entity";
}
const SpriteComponent = defineComponent(
  class SpriteComponent {
    sprite = new Sprite();
    readonly position = this.sprite.position;
  },
);

test("compose entities from components", () => {
  const entity = new BaseEntity();
  SpriteComponent.add(entity);

  if (SpriteComponent.has(entity)) {
    {
      // TODO(low): type tests
      const e: HasComponent<BaseEntity, typeof SpriteComponent> = entity;
      void e;
    }
    assert(entity.sprite instanceof Sprite);
    assert.equal(entity.position, entity.sprite.position);
    entity.position.set(1, 2, 3);
    assert.equal(entity.sprite.position.x, 1);
    assert.equal(entity.sprite.position.y, 2);
    assert.equal(entity.sprite.position.z, 3);
    assert(SpriteComponent.entities.has(entity));
  } else {
    assert.fail("entity should have sprite component");
  }
});

test("remove entities from components", () => {
  const entity = new BaseEntity();
  SpriteComponent.add(entity);

  if (SpriteComponent.has(entity)) {
    SpriteComponent.remove(entity);
    assert(!SpriteComponent.has(entity));
    assert(!SpriteComponent.entities.has(entity));
    assert(!("sprite" in entity));
    assert(!("position" in entity));
  }
});

/*
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * TODO remove old code
 */

test("PrimativeArrayComponent: set has get is", () => {
  const Component = new PrimativeArrayComponent([] as boolean[]);
  Component.set(42, true);
  assert.equal(Component.get(42), true);
  assert(Component.has(42));
  assert(!Component.has(0));
  assert.throws(() => Component.get(0));
  assert.equal(Component.get(0, true), true);
  assert(Component.is(42, true));
});

test("PrimativeArrayComponent: serialize deserialize", () => {
  const Component = new PrimativeArrayComponent([] as boolean[]);
  Component.set(42, true);
  assert.equal(Component.serialize(42), true);
  assert.throws(() => Component.serialize(0));
  Component.deserialize(0, false);
  assert.equal(Component.get(0), false);
});

test("PrimativeArrayComponent: remove", () => {
  const Component = new PrimativeArrayComponent([] as boolean[]);
  Component.set(42, true);
  Component.set(43, true);
  Component.remove(42);
  assert(!Component.has(42));
  assert(Component.has(43));

  // ok to remove non-existent
  Component.remove(3490);
});

class Vector3Component extends ObjectArrayComponent<
  Vector3,
  { x: number; y: number; z: number }
> {
  constructor() {
    super(() => new Vector3());
  }
  copy(dest: Vector3, src: Vector3) {
    dest.copy(src);
  }
  equals(a: Vector3, b: Vector3) {
    return a.equals(b);
  }
}

test("ObjectArrayComponent: acquire set has get is", () => {
  const Component = new Vector3Component();
  const addSpy = test.mock.fn();
  const changeSpy = test.mock.fn();
  const addMock = getMock(addSpy);
  const changeMock = getMock(changeSpy);
  Component.addEventListener("add", addSpy);
  Component.addEventListener("change", changeSpy);
  Component.acquire(42);
  const newVector = new Vector3(1, 2, 3);
  Component.set(43, newVector);
  Component.deserialize(44, { x: 3, y: 2, z: 1 });
  assert(Component.has(42));
  assert(Component.has(43));
  assert(Component.has(44));
  assert(!Component.has(0));
  assert.throws(() => Component.get(0));
  const gotValue42 = Component.get(42);
  assert.equal(gotValue42.x, 0);
  assert.equal(gotValue42.y, 0);
  assert.equal(gotValue42.z, 0);
  const gotValue43 = Component.get(43);
  assert.equal(gotValue43.x, 1);
  assert.equal(gotValue43.y, 2);
  assert.equal(gotValue43.z, 3);
  const gotValue44 = Component.get(44);
  assert.equal(gotValue44.x, 3);
  assert.equal(gotValue44.y, 2);
  assert.equal(gotValue44.z, 1);
  const defaultValue = new Vector3(1, 2, 3);
  const gotDefaultValue = Component.get(0, defaultValue);
  assert.equal(gotDefaultValue.x, defaultValue.x);
  assert.equal(gotDefaultValue.y, defaultValue.y);
  assert.equal(gotDefaultValue.z, defaultValue.z);

  // `get()` returns a mutable object, but make sure you know what you're doing!
  Component.get(42).x = 0;

  assert.equal(addMock.calls.length, 3);
  const addEvent = addMock.calls[0].arguments[0];
  assert.equal(addEvent.entityId, 42);
  assert.deepEqual(addEvent.value, new Vector3());

  assert.equal(changeMock.calls.length, 2);
  const changeEvent = changeMock.calls[0].arguments[0];
  assert.equal(changeEvent.entityId, 43);
  assert.deepEqual(changeEvent.value, new Vector3(1, 2, 3));
});

test("ObjectArrayComponent: serialize deserialize", () => {
  const Component = new Vector3Component();
  const value = new Vector3();
  const changeEventSpy = test.mock.fn();
  const changeEventMock = getMock(changeEventSpy);
  Component.acquire(42);

  assert.throws(() => Component.serialize(0));

  assert.deepEqual(Component.serialize(42), value);

  Component.addEventListener("change", changeEventSpy);
  Component.deserialize(0, new Vector3(4, 5, 6));
  assert.deepEqual(Component.serialize(0), new Vector3(4, 5, 6));

  assert.equal(changeEventMock.calls.length, 1);
  const changeEvent = changeEventMock.calls[0].arguments[0];
  assert.equal(changeEvent.entityId, 0);
  assert.deepEqual(changeEvent.value, new Vector3(4, 5, 6));
});

test("ObjectArrayComponent: remove", () => {
  const Component = new Vector3Component();
  Component.acquire(42);
  Component.acquire(43);
  Component.remove(42);
  assert(!Component.has(42));
  assert(Component.has(43));

  // ok to remove non-existent
  Component.remove(3490);
});

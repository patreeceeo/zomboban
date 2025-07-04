import { World } from "./EntityManager";
import test from "node:test";
import assert from "node:assert";
import { getMock } from "./testHelpers";
import {ENTITY_META_PROPERTY} from "./Entity";

test("adding entities", () => {
  const world = new World();
  const addEntitySpy = test.mock.fn();
  const addEntityMock = getMock(addEntitySpy);
  world.entities.onAdd(addEntitySpy);
  const entity = world.addEntity();

  assert.equal(addEntityMock.calls.length, 1);
  assert.equal(addEntityMock.calls[0].arguments[0], entity);
  assert.equal(entity[ENTITY_META_PROPERTY].world, world);
});

test("removing entities", () => {
  const world = new World();
  const removeEntitySpy = test.mock.fn();
  const removeEntityMock = getMock(removeEntitySpy);
  world.entities.onRemove(removeEntitySpy);
  const entity = world.addEntity();
  world.removeEntity(entity);

  assert.equal(removeEntityMock.calls.length, 1);
  assert.equal(removeEntityMock.calls[0].arguments[0], entity);
});

test("stream entities that have been or will be added", () => {
  const state = new World();
  const addEntitySpy = test.mock.fn();
  const addEntityMock = getMock(addEntitySpy);
  const entity = state.addEntity();
  state.entities.stream(addEntitySpy);
  assert.equal(addEntityMock.calls.length, 1);
  assert.equal(addEntityMock.calls[0].arguments[0], entity);
});

import { World } from "./EntityManager";
import test from "node:test";
import assert from "node:assert";
import { getMock } from "./testHelpers";
import {Entity, getEntityMeta} from "./Entity";
import {IComponentDefinition} from "./Component";

test("adding entities", () => {
  const world = new World();
  const addEntitySpy = test.mock.fn();
  const addEntityMock = getMock(addEntitySpy);
  world.entities.onAdd(addEntitySpy);
  const entity = world.addEntity();
  const entityMeta = getEntityMeta(entity);

  assert.equal(addEntityMock.calls.length, 1);
  assert.equal(addEntityMock.calls[0].arguments[0], entity);
  assert.equal(entityMeta.world, world);
  assert.throws(() => {
    world.addEntity(new Entity(new World(), 0));
  });
  assert.equal(entityMeta.id, 0);
  assert.equal(getEntityMeta(world.addEntity()).id, 1)
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

test("getEntitiesWith", () => {
  const MyComponent: IComponentDefinition = {} as any;

  const world = new World();
  const entity1 = world.addEntity();
  const entity2 = world.addEntity();
  const entity3 = world.addEntity();

  world._addComponent(entity1, MyComponent);
  world._addComponent(entity3, MyComponent);

  const entitiesWithComponent = world.getEntitiesWith(MyComponent);
  assert.equal(entitiesWithComponent.size, 2);
  assert.equal(entitiesWithComponent.has(entity1), true);
  assert.equal(entitiesWithComponent.has(entity3), true);

  world._removeComponent(entity1, MyComponent);
  assert.equal(entitiesWithComponent.size, 1);
  assert.equal(entitiesWithComponent.has(entity3), true);

  world._removeComponent(entity3, MyComponent);
  assert.equal(entitiesWithComponent.size, 0);
});

test("getComponentsWith", () => {
  const MyComponentA: IComponentDefinition = {} as any;
  const MyComponentB: IComponentDefinition = {} as any;

  const world = new World();
  const entity1 = world.addEntity();
  const entity2 = world.addEntity();
  const entity3 = world.addEntity();

  world._addComponent(entity1, MyComponentA);
  world._addComponent(entity2, MyComponentB);
  world._addComponent(entity3, MyComponentA);
  world._addComponent(entity3, MyComponentB);

  const componentsWithEntity1 = world.getComponentsWith(entity1);
  assert.equal(componentsWithEntity1.size, 1);
  assert.equal(componentsWithEntity1.has(MyComponentA), true);

  const componentsWithEntity2 = world.getComponentsWith(entity2);
  assert.equal(componentsWithEntity2.size, 1);
  assert.equal(componentsWithEntity2.has(MyComponentB), true);

  const componentsWithEntity3 = world.getComponentsWith(entity3);
  assert.equal(componentsWithEntity3.size, 2);
  assert.equal(componentsWithEntity3.has(MyComponentA), true);
  assert.equal(componentsWithEntity3.has(MyComponentB), true);
});

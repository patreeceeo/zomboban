import assert from "node:assert";
import test from "node:test";
import {
  ComponentFilterEntitySource,
  ComponentFilterRegistry,
  Not,
  Query,
  QueryManager
} from "./Query";
import {
  ComponentRegistry,
  PrimativeArrayComponent,
  defineComponent
} from "./Component";
import { Sprite, Vector3 } from "three";
import { World } from "./EntityManager";

function setUp() {
  const SpriteComponent = defineComponent(
    class SpriteComponent {
      sprite = new Sprite();
      readonly position = this.sprite.position;
    }
  );

  const VelocityComponent = defineComponent(
    class VelocityComponent {
      velocity = new Vector3();
      static deserialize<E extends VelocityComponent>(
        entity: E,
        data: { x: number; y: number; z: number }
      ) {
        entity.velocity.set(data.x, data.y, data.z);
      }
      static serialize<E extends VelocityComponent>(entity: E) {
        return {
          x: entity.velocity.x,
          y: entity.velocity.y,
          z: entity.velocity.z
        };
      }
    }
  );

  // register all components
  const q = new QueryManager();
  const world = new World();
  return { q, world, SpriteComponent, VelocityComponent };
}

test("query for entities in components", () => {
  const { q, world, SpriteComponent, VelocityComponent } = setUp();
  const entity = world.addEntity();
  const entity2 = world.addEntity();
  const entity3 = world.addEntity();
  const onAddSpy = test.mock.fn();
  const streamSpy = test.mock.fn();

  SpriteComponent.add(entity);
  VelocityComponent.add(entity);

  const query = q.query([SpriteComponent, VelocityComponent]);

  SpriteComponent.add(entity2);

  query.onAdd(onAddSpy);

  SpriteComponent.add(entity3);
  VelocityComponent.add(entity3);

  query.stream(streamSpy);

  assert.equal(streamSpy.mock.calls.length, 2);
  assert.equal(streamSpy.mock.calls[0].arguments[0], entity);
  assert.equal(streamSpy.mock.calls[1].arguments[0], entity3);
  assert.equal(onAddSpy.mock.calls.length, 1);
  assert.equal(onAddSpy.mock.calls[0].arguments[0], entity3);
});

test("query for entities formerly in components", () => {
  const { q, world, SpriteComponent, VelocityComponent } = setUp();
  const entity = world.addEntity();
  const entity2 = world.addEntity();
  const entity3 = world.addEntity();
  const spy = test.mock.fn();

  SpriteComponent.add(entity);
  VelocityComponent.add(entity);

  const query = q.query([SpriteComponent, VelocityComponent]);

  SpriteComponent.add(entity2);

  SpriteComponent.add(entity3);
  VelocityComponent.add(entity3);

  assert(SpriteComponent.has(entity));
  SpriteComponent.remove(entity);

  assert(VelocityComponent.has(entity));
  VelocityComponent.remove(entity);

  query.onRemove(spy);

  assert(SpriteComponent.has(entity2));
  SpriteComponent.remove(entity2);

  assert(VelocityComponent.has(entity3));
  // still removed from query if we remove only one of the components
  VelocityComponent.remove(entity3);

  assert.equal(spy.mock.calls.length, 1);
  assert.equal(spy.mock.calls[0].arguments[0], entity3);
});

test("query for entities not in components", () => {
  const { q, world, SpriteComponent, VelocityComponent } = setUp();
  const entity = world.addEntity();
  const entity2 = world.addEntity();
  const streamSpy = test.mock.fn();

  SpriteComponent.add(entity);
  VelocityComponent.add(entity);

  SpriteComponent.add(entity2);

  const query = q.query([SpriteComponent, Not(VelocityComponent)]);
  query.stream(streamSpy);

  assert.equal(streamSpy.mock.calls[0].arguments[0], entity2);
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
 *
 *
 *
 *
 * TODO remove old code
 */

const entitySource = { get: () => [1, 2, 3, 4] };
test("Query: basic", () => {
  const query = Query.build(entitySource).complete(
    ({ entityId }) => entityId % 2 !== 0
  );
  assert.deepEqual(query(), [1, 3]);
});

test("Query: with param", () => {
  const query = Query.build(entitySource)
    .addParam("mod", 0)
    .complete(({ entityId, mod }) => entityId % 2 === mod);

  assert.throws(() => assert.deepEqual(query(), [1, 3]));

  query.setParam("mod", 0);

  assert.deepEqual(query(), [2, 4]);
});

test("ComponentFilterRegistry: prevents duplicates", () => {
  const registry = new ComponentFilterRegistry();
  const componentA = new PrimativeArrayComponent([] as number[]);
  const componentB = new PrimativeArrayComponent([] as number[]);
  const filter = new ComponentFilterEntitySource([componentA, componentB]);

  const id = registry.register(filter);
  const id2 = registry.register(filter);
  assert.equal(id, id2);

  const filter2 = new ComponentFilterEntitySource([componentA, componentB]);
  const id3 = registry.register(filter2);

  assert.equal(id, id3);
});

test("ComponentFilterRegistry: recognizes differences", () => {
  const registry = new ComponentFilterRegistry();
  const componentA = new PrimativeArrayComponent([] as number[]);
  const componentB = new PrimativeArrayComponent([] as number[]);
  const componentC = new PrimativeArrayComponent([] as number[]);
  const filter = new ComponentFilterEntitySource([componentA, componentB]);
  const moreSpecific = new ComponentFilterEntitySource([
    componentA,
    componentB,
    componentC
  ]);
  const id = registry.register(filter);
  const id2 = registry.register(moreSpecific);

  assert.notEqual(id, id2);
});

class ComponentA extends PrimativeArrayComponent<number> {
  constructor() {
    super([]);
  }
}

class ComponentB extends PrimativeArrayComponent<number> {
  constructor() {
    super([]);
  }
}

test("Query.buildWithComponentFilterEntitySource", () => {
  const filterRegistry = new ComponentFilterRegistry();

  const componentRegistry = new ComponentRegistry(
    (_klass, entityId) => {
      for (const filter of filterRegistry.values()) {
        filter.handleAdd(entityId);
      }
    },
    (_klass, entityId) => {
      for (const filter of filterRegistry.values()) {
        filter.handleRemove(entityId);
      }
    }
  );
  componentRegistry.register(new ComponentA());
  componentRegistry.register(new ComponentB());

  componentRegistry.get(ComponentA).set(1, 16);
  componentRegistry.get(ComponentB).set(1, 32);

  const query = Query.buildWithComponentFilterEntitySource(
    componentRegistry,
    filterRegistry,
    [ComponentA, ComponentB],
    [1]
  ).complete();

  componentRegistry.get(ComponentA).set(2, 23);
  componentRegistry.get(ComponentB).set(2, 108);
  componentRegistry.get(ComponentB).remove(2);

  componentRegistry.get(ComponentA).set(3, 13);
  componentRegistry.get(ComponentB).set(3, 33);

  componentRegistry.get(ComponentB).set(4, 43);

  assert.deepEqual(query(), [1, 3]);
});

import assert from "node:assert";
import test from "node:test";
import {
  NoMemoQueryManager,
  Not,
  QueryManager,
} from "./Query";
import { IComponentDefinition, defineComponent } from "./Component";
import { Sprite, Vector3 } from "three";
import { World } from "./EntityManager";
import { NameComponent } from "./components";

interface ISpriteComponent {
  sprite: Sprite;
  position: Vector3;
}

interface IVelocityComponent {
  velocity: Vector3;
}

const SpriteComponent: IComponentDefinition<
  ISpriteComponent,
  new () => ISpriteComponent
> = defineComponent(
  class SpriteComponent {
    sprite = new Sprite();
    readonly position = this.sprite.position;
    static humanName = "Sprite";
  }
);

const VelocityComponent: IComponentDefinition<
  { x: number; y: number; z: number },
  new () => IVelocityComponent
> = defineComponent(
  class VelocityComponent {
    velocity = new Vector3();
    static deserialize<E extends VelocityComponent>(
      entity: E,
      data: { x: number; y: number; z: number }
    ) {
      entity.velocity.set(data.x, data.y, data.z);
    }
    static canDeserialize(data: any) {
      return (
        typeof data === "object" && "x" in data && "y" in data && "z" in data
      );
    }
    static serialize<E extends VelocityComponent>(entity: E) {
      return {
        x: entity.velocity.x,
        y: entity.velocity.y,
        z: entity.velocity.z
      };
    }
    static humanName = "Velocity";
  }
);

function setUp() {
  const world = new World();
  const q = new QueryManager(world);
  return { q, world };
}

test("query for entities in components", () => {
  const { q, world } = setUp();
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
  const { q, world } = setUp();
  const entity = world.addEntity();
  NameComponent.add(entity, { name: "Alice" });
  const entity2 = world.addEntity();
  NameComponent.add(entity2, { name: "Bob" });
  const entity3 = world.addEntity();
  NameComponent.add(entity3, { name: "Char" });
  const spy = test.mock.fn((entity) => {
    assert("velocity" in entity);
  });

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
  const { q, world } = setUp();
  const entityA = world.addEntity();
  const entityB = world.addEntity();
  const streamSpy = test.mock.fn();
  const removeSpy = test.mock.fn();

  SpriteComponent.add(entityA);
  VelocityComponent.add(entityA);

  SpriteComponent.add(entityB);

  const query = q.query([SpriteComponent, Not(VelocityComponent, world)]);
  query.stream(streamSpy);
  query.onRemove(removeSpy);

  assert.equal(streamSpy.mock.calls[0].arguments[0], entityB);

  VelocityComponent.remove(entityA);
  assert.equal(streamSpy.mock.calls[1].arguments[0], entityA);

  VelocityComponent.add(entityA);
  assert.equal(removeSpy.mock.calls[0].arguments[0], entityA);
});

test("query memoization", () => {
  const { q, world } = setUp();
  const query1 = q.query([SpriteComponent, VelocityComponent]);
  const query2 = q.query([VelocityComponent, SpriteComponent]);
  const query3 = q.query([SpriteComponent]);
  const query4 = q.query([SpriteComponent]);
  const noMemoQ = new NoMemoQueryManager(world);
  const query5 = noMemoQ.query([SpriteComponent]);
  const entity = world.addEntity();
  SpriteComponent.add(entity);
  assert.equal(query1, query2);
  assert.notEqual(query1, query3);
  assert.equal(query3, query4);
  assert.notEqual(query3, query5);
  assert.deepEqual(Array.from(query3), [entity]);
});

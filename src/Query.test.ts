import assert from "node:assert";
import test from "node:test";
import { Not, QueryManager, Some, WithinArea } from "./Query";
import { IComponentDefinition, defineComponent } from "./Component";
import { Sprite, Vector3 } from "three";
import { World } from "./EntityManager";
import { ObservableSet } from "./Observable";
import { NameComponent } from "./components";
import { Rectangle } from "./Rectangle";

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
  const q = new QueryManager();
  const world = new World();
  return { q, world };
}

test.afterEach(() => {
  (SpriteComponent.entities as unknown as ObservableSet<number>).unobserve();
  (VelocityComponent.entities as unknown as ObservableSet<number>).unobserve();
  SpriteComponent.clear();
  VelocityComponent.clear();
});

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

  SpriteComponent.add(entityA);
  VelocityComponent.add(entityA);

  SpriteComponent.add(entityB);

  const query = q.query([SpriteComponent, Not(VelocityComponent)]);
  query.stream(streamSpy);

  assert.equal(streamSpy.mock.calls[0].arguments[0], entityB);

  VelocityComponent.remove(entityA);
  assert.equal(streamSpy.mock.calls[1].arguments[0], entityA);
});

test("query memoization", () => {
  const { q, world } = setUp();
  const query1 = q.query([SpriteComponent, VelocityComponent]);
  const query2 = q.query([VelocityComponent, SpriteComponent]);
  const query3 = q.query([SpriteComponent]);
  const query4 = q.query([SpriteComponent]);
  const query5 = q.query([SpriteComponent], { memoize: false });
  const entity = world.addEntity();
  SpriteComponent.add(entity);
  assert.equal(query1, query2);
  assert.notEqual(query1, query3);
  assert.equal(query3, query4);
  assert.notEqual(query3, query5);
  assert.deepEqual(Array.from(query3), [entity]);
});

test("query for entities with some combination of components", () => {
  const { q, world } = setUp();
  const entity = world.addEntity();
  const entity2 = world.addEntity();
  const entity3 = world.addEntity();
  const entity4 = world.addEntity();
  const streamSpy = test.mock.fn();

  const query = q.query([Some(SpriteComponent, VelocityComponent)]);

  query.stream(streamSpy);

  NameComponent.add(entity, { name: "Al" });
  SpriteComponent.add(entity);
  VelocityComponent.add(entity);

  NameComponent.add(entity2, { name: "Bob" });
  SpriteComponent.add(entity2);

  NameComponent.add(entity3, { name: "Cindy" });
  NameComponent.add(entity4, { name: "Dorothy" });

  assert.equal(streamSpy.mock.callCount(), 3);
  assert.equal(streamSpy.mock.calls[0].arguments[0], entity);
  assert.equal(streamSpy.mock.calls[2].arguments[0], entity2);
});

test("query for entities within a given area", () => {
  const { q, world } = setUp();
  const entity = world.addEntity();
  const entity2 = world.addEntity();

  SpriteComponent.add(entity);
  entity.position.set(11, 22, 33);

  SpriteComponent.add(entity2);
  entity2.position.set(22, 33, 44);

  const rect = new Rectangle(0, 0, 2, 2).setCenter(11, 22);

  const query = q.query([SpriteComponent, WithinArea(rect)]);

  const entities = Array.from(query);

  assert.equal(entities.length, 1);
  assert.equal(entities[0], entity);
});

test("within area parameter memoization", () => {
  const rect1 = new Rectangle(0, 0, 2, 2).setCenter(11, 22);
  const rect2 = new Rectangle(0, 0, 2, 2).setCenter(11, 22);
  const p1 = WithinArea(rect1);
  const p2 = WithinArea(rect2);

  assert.equal(p1, p2);
});

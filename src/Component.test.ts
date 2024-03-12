import test from "node:test";
import assert from "node:assert";
import { IComponentDefinition, defineComponent } from "./Component";
import { Sprite, Vector3 } from "three";
import { WithGetterSetter } from "./Mixins";

class BaseEntity {}

interface ISpriteComponent {
  sprite: Sprite;
  position: Vector3;
  visible: boolean;
}
const SpriteComponent: IComponentDefinition<never, new () => ISpriteComponent> =
  defineComponent(
    WithGetterSetter(
      "visible",
      (c) => c.sprite.visible,
      (c, v) => (c.sprite.visible = v),
      class {
        static humanName = "Sprite";
        sprite = new Sprite();
        readonly position = this.sprite.position;
      }
    )
  );

interface IVelocityComponent {
  velocity: Vector3;
}
interface IVelocityComponentData {
  x: number;
  y: number;
  z: number;
}
const VelocityComponent: IComponentDefinition<
  IVelocityComponentData,
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
    // TODO add target parameter
    static serialize<E extends VelocityComponent>(
      entity: E,
      target: { x: number; y: number; z: number }
    ) {
      const { x, y, z } = entity.velocity;
      target.x = x;
      target.y = y;
      target.z = z;
      return target;
    }
  }
);

test("compose entities from components", () => {
  const entity = new BaseEntity();
  SpriteComponent.add(entity);
  VelocityComponent.add(entity, { x: 1, y: 2, z: 3 });

  assert(entity.sprite instanceof Sprite);
  assert.equal(entity.position, entity.sprite.position);
  entity.position.set(1, 2, 3);
  assert.equal(entity.sprite.position.x, 1);
  assert.equal(entity.sprite.position.y, 2);
  assert.equal(entity.sprite.position.z, 3);
  assert.equal(entity.velocity.x, 1);
  assert.equal(entity.velocity.y, 2);
  assert.equal(entity.velocity.z, 3);
  assert(SpriteComponent.entities.has(entity));
  assert(VelocityComponent.entities.has(entity));
  entity.visible = false;
  assert.equal(entity.visible, false);
});

test("remove entities from components", () => {
  const entity = new BaseEntity();
  SpriteComponent.add(entity);

  SpriteComponent.remove(entity);
  assert(!SpriteComponent.has(entity));
  assert(!SpriteComponent.entities.has(entity));
  assert(!("sprite" in entity));
  assert(!("position" in entity));
});

test("errors on adding non-conformer directly to entity set", () => {
  const entity = new BaseEntity();
  assert.throws(() => (SpriteComponent.entities as any).add(entity));
});

test("deserialize component", () => {
  const entity = new BaseEntity();
  const entity2 = new BaseEntity();

  // the add method uses the deserialize method
  VelocityComponent.add(entity, { x: 1, y: 2, z: 3 });
  assert.equal(entity.velocity.x, 1);
  assert.equal(entity.velocity.y, 2);
  assert.equal(entity.velocity.z, 3);

  // you don't have to deserialize, though
  VelocityComponent.add(entity2);
  assert.equal(entity2.velocity.x, 0);
  assert.equal(entity2.velocity.y, 0);
  assert.equal(entity2.velocity.z, 0);

  // `deserialize` must be included in the definition in order to pass data to `add`
  assert.throws(() => SpriteComponent.add(entity, {} as any));

  // deserializing happens before the `add` event
  const addSpy = test.mock.fn();
  VelocityComponent.entities.onAdd(addSpy);
  VelocityComponent.add({}, { x: 9, y: 8, z: 7 });
  assert.equal(addSpy.mock.calls.length, 1);
  assert.deepEqual(addSpy.mock.calls[0].arguments[0], {
    velocity: new Vector3(9, 8, 7)
  });
});

test("serialize component", () => {
  const entity = new BaseEntity();
  VelocityComponent.add(entity, { x: 1, y: 2, z: 3 });

  assert(VelocityComponent.has(entity));
  const serialized = VelocityComponent.serialize(entity);
  assert.deepEqual(serialized, { x: 1, y: 2, z: 3 });

  const target = {};
  VelocityComponent.serialize(entity, target);
  assert.deepEqual(target, { x: 1, y: 2, z: 3 });

  // `serialize` must be included in the definition in order to serialize
  assert.throws(() => SpriteComponent.serialize(entity as any));
});

test("components assist with debugging", () => {
  assert.equal(SpriteComponent.toString(), "Sprite");
});

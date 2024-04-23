import { IComponentDefinition, defineComponent } from "./Component";
import chalk from "chalk";
import { World } from "./EntityManager";
import { QueryManager } from "./Query";

// TODO get these times lower!
// TODO serialize/deserialize

const entityCount = 1_000_000;

const heading = (text: string) => {
  console.log();
  console.log(chalk.bgCyanBright(` ${text} `));
  console.log();
};

const profile = (name: string, setup: () => () => () => () => boolean) => {
  const test = setup();
  const before = performance.now();
  const cleanup = test();
  const assertion = cleanup();
  const after = performance.now();

  /* Check assertion */
  if (!assertion()) {
    throw new Error("Assertion failed!");
  }

  /* Results */
  const duration = after - before;
  const ops = entityCount / (after - before);

  console.log(
    `${name.padStart(50)}  ${duration.toFixed(2).padStart(8)}ms ${ops
      .toFixed(1)
      .padStart(10)} ops/ms`
  );
};

type IVector = {
  x: number;
  y: number;
  z: number;
};
interface IPositionComponent {
  position: IVector;
}
const PositionComponent: IComponentDefinition<
  IVector,
  new () => IPositionComponent
> = defineComponent(
  class implements IPositionComponent {
    position = { x: 0, y: 0, z: 0 };

    static deserialize(entity: IPositionComponent, { x, y, z }: IVector) {
      const { position } = entity;
      position.x = x;
      position.y = y;
      position.z = z;
    }

    static canDeserialize(data: any) {
      return (
        typeof data === "object" && "x" in data && "y" in data && "z" in data
      );
    }

    static serialize(entity: IPositionComponent, target: IVector) {
      const { x, y, z } = entity.position;
      target.x = x;
      target.y = y;
      target.z = z;
      return target;
    }
  }
);
interface IVelocityComponent {
  velocity: IVector;
}
const VelocityComponent: IComponentDefinition<
  IVector,
  new () => IVelocityComponent
> = defineComponent(
  class implements IVelocityComponent {
    velocity = { x: 0, y: 0, z: 0 };
    static deserialize(entity: IVelocityComponent, { x, y, z }: IVector) {
      const { velocity } = entity;
      velocity.x = x;
      velocity.y = y;
      velocity.z = z;
    }

    static canDeserialize(data: any) {
      return (
        typeof data === "object" && "x" in data && "y" in data && "z" in data
      );
    }

    static serialize(entity: IVelocityComponent, target: IVector) {
      const { x, y, z } = entity.velocity;
      target.x = x;
      target.y = y;
      target.z = z;
      return target;
    }
  }
);

console.log(`Entity count: ${entityCount}\n`);

heading("Entity Addition");

profile("add (with components)", () => {
  const world = new World();

  return () => {
    for (let i = 0; i < entityCount; i++) {
      const entity = world.addEntity();
      PositionComponent.add(entity);
      entity.position.y = i;
      VelocityComponent.add(entity);
    }

    return () => {
      VelocityComponent.clear();
      PositionComponent.clear();
      return () => world.entities.size === entityCount;
    };
  };
});

heading("Entity Removal");

profile("remove (random, with components)", () => {
  const world = new World();
  for (let i = 0; i < entityCount; i++) {
    const entity = world.addEntity();
    PositionComponent.add(entity);
    VelocityComponent.add(entity);
  }

  return () => {
    const worldEntities = Array.from(world.entities);
    while (world.entities.size > 0) {
      /* Get a random entity... */
      const entity =
        worldEntities[Math.floor(Math.random() * worldEntities.length)];

      /* ...and delete it */
      VelocityComponent.remove(entity);
      PositionComponent.remove(entity);
      world.removeEntity(entity);
    }

    return () => {
      VelocityComponent.clear();
      PositionComponent.clear();
      return () => world.entities.size === 0;
    };
  };
});

profile("clear", () => {
  const world = new World();
  for (let i = 0; i < entityCount; i++) {
    const entity = world.addEntity();
    PositionComponent.add(entity);
    entity.position.y = i;
    VelocityComponent.add(entity);
  }

  return () => {
    VelocityComponent.clear();
    PositionComponent.clear();
    world.entities.clear();

    return () => {
      return () => world.entities.size === 0;
    };
  };
});

heading("Iteration");

profile("simulate (iterator, query)", () => {
  const world = new World();
  const queryMgr = new QueryManager();
  const withVelocity = queryMgr.query([PositionComponent, VelocityComponent]);

  for (let i = 0; i < entityCount; i++) {
    const entity = world.addEntity();
    PositionComponent.add(entity);
    const { position } = entity;
    position.x = Math.random() * 200 - 100;
    position.y = i;
    VelocityComponent.add(entity);
    const { velocity } = entity;
    velocity.x = 1;
    velocity.y = 2;
    velocity.z = 3;
  }

  return () => {
    let i = 0;

    for (const { position, velocity } of withVelocity) {
      i++;
      position.x += velocity.x;
      position.y += velocity.y;
      position.z += velocity.z;
    }

    return () => {
      VelocityComponent.clear();
      PositionComponent.clear();
      return () => i === entityCount;
    };
  };
});

profile("simulate (iterator, world)", () => {
  const world = new World();

  for (let i = 0; i < entityCount; i++) {
    const entity = world.addEntity();
    PositionComponent.add(entity);
    const { position } = entity;
    position.x = Math.random() * 200 - 100;
    position.y = i;
    if (i % 2 === 0) {
      VelocityComponent.add(entity);
      const { velocity } = entity;
      velocity.x = 1;
      velocity.y = 2;
      velocity.z = 3;
    }
  }

  return () => {
    let i = 0;
    const { entities } = world;
    for (const entity of entities) {
      i++;
      if (!VelocityComponent.has(entity)) continue;

      const { position, velocity } = entity as IPositionComponent &
        IVelocityComponent;
      position.x += velocity.x;
      position.y += velocity.y;
      position.z += velocity.z;
    }

    return () => {
      VelocityComponent.clear();
      PositionComponent.clear();
      return () => i === entityCount;
    };
  };
});

heading("ooflorent's packed_5");

const ComponentA: IComponentDefinition<null, new () => { A: number }> =
  defineComponent(
    class {
      A = 1;
    }
  );
const ComponentB: IComponentDefinition<null, new () => { B: number }> =
  defineComponent(
    class {
      B = 1;
    }
  );
const ComponentC: IComponentDefinition<null, new () => { C: number }> =
  defineComponent(
    class {
      C = 1;
    }
  );
const ComponentD: IComponentDefinition<null, new () => { D: number }> =
  defineComponent(
    class {
      D = 1;
    }
  );
const ComponentE: IComponentDefinition<null, new () => { E: number }> =
  defineComponent(
    class {
      E = 1;
    }
  );

profile("1000x for entity of 1000 entities", () => {
  const world = new World();
  const queryMgr = new QueryManager();

  for (let i = 0; i < 1000; i++) {
    const e = world.addEntity();
    ComponentA.add(e);
    ComponentB.add(e);
    ComponentC.add(e);
    ComponentD.add(e);
    ComponentE.add(e);
  }

  const withA = queryMgr.query([ComponentA]);
  const withB = queryMgr.query([ComponentB]);
  const withC = queryMgr.query([ComponentC]);
  const withD = queryMgr.query([ComponentD]);
  const withE = queryMgr.query([ComponentE]);

  return () => {
    for (let i = 0; i < 1000; i++) {
      for (const entity of withA) entity.A *= 2;
      for (const entity of withB) entity.B *= 2;
      for (const entity of withC) entity.C *= 2;
      for (const entity of withD) entity.D *= 2;
      for (const entity of withE) entity.E *= 2;
    }

    return () => {
      ComponentA.clear();
      ComponentB.clear();
      ComponentC.clear();
      ComponentD.clear();
      ComponentE.clear();
      return () => true;
    };
  };
});

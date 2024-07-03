import { IComponentDefinition } from "./Component";
import { EntityMeta, IEntityWithMeta } from "./EntityMeta";
import { invariant } from "./Error";
import { IObservableSet, ObservableSet } from "./Observable";

export function stringifyEntity(entity: IEntity) {
  const meta = EntityMeta.get(entity);
  const componentStrings = [];
  for (const component of meta.components) {
    componentStrings.push(component.toString());
  }
  return `Entity with ${componentStrings.join(", ")}`;
}

// TODO toString()?
export interface IEntity extends IEntityWithMeta {}

export interface IEntityFactory<W extends IWorld, E extends IEntity> {
  (world: W): E;
}

export interface IEntityPrefab<W extends IWorld, T extends IEntity = IEntity> {
  create: IEntityFactory<W, T>;
  destroy: (entity: T) => T;
}

export interface IWorld {
  entities: IObservableSet<IEntity>;
  addEntity<
    Entity extends IEntity,
    Factory extends IEntityFactory<this, Entity>
  >(
    Factory?: Factory
  ): ReturnType<Factory>;
  removeEntity(entity: IEntity): void;
}

// TODO default entity factory given in constructor?
export class World implements IWorld {
  #entities = new ObservableSet<IEntity>();

  get entities() {
    return this.#entities;
  }

  addEntity<
    Entity extends IEntity,
    Factory extends IEntityFactory<this, Entity>
  >(Factory?: Factory): ReturnType<Factory> {
    const entity = Factory ? Factory(this) : ({} as IEntity);
    EntityMeta.set(entity);
    invariant(EntityMeta.has(entity), `Entity is missing metadata`);
    this.#entities.add(entity);
    return entity as ReturnType<Factory>;
  }

  removeEntity(entity: IEntity) {
    this.#entities.remove(entity);
    invariant(EntityMeta.has(entity), `Entity is missing metadata`);

    const meta = EntityMeta.get(entity);

    for (const component of meta.components) {
      component.remove(entity);
    }
  }

  registerComponent(component: IComponentDefinition<any>) {
    component.entities.onAdd((entity) => {
      invariant(EntityMeta.has(entity), `Entity is missing metadata`);
      const meta = EntityMeta.get(entity);
      meta.components.add(component);
    });
  }
}

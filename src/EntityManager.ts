import { IComponentDefinition } from "./Component";
import { IObservableSet, ObservableSet } from "./Observable";

export interface IEntity {}

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
export class World {
  #entities = new ObservableSet<IEntity>();
  #componentMap = new Map<IEntity, Set<IComponentDefinition<any>>>();

  get entities() {
    return this.#entities;
  }

  addEntity<
    Entity extends IEntity,
    Factory extends IEntityFactory<this, Entity>
  >(Factory?: Factory): ReturnType<Factory> {
    const entity = Factory ? Factory(this) : {};
    this.#entities.add(entity);
    this.#componentMap.set(entity, new Set());
    return entity as ReturnType<Factory>;
  }

  removeEntity(entity: IEntity) {
    this.#entities.remove(entity);
    const set = this.#componentMap.get(entity)!;
    for (const component of set) {
      component.remove(entity);
    }
  }

  registerComponent(component: IComponentDefinition<any>) {
    component.entities.onAdd((entity) => {
      this.#componentMap.get(entity)!.add(component);
    });
  }
}

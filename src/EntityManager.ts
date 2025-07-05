import {NumberKeyedMap} from "./collections";
import { IComponentDefinition } from "./Component";
import { Entity, getEntityMeta, isEntity } from "./Entity";
import { invariant } from "./Error";
import { IObservableSet, IReadonlyObservableSet, ObservableSet } from "./Observable";
import {emptySet} from "./util";

export interface IEntityFactory<W extends IWorld, E extends Entity> {
  (world: W): E;
}

export interface IWorld {
  // TODO: change to ReadonlySet, or Iterable?
  entities: IObservableSet<Entity>;
  addEntity(): Entity;
  removeEntity(entity: Entity): void;
}

export class World implements IWorld {
  #entities = new ObservableSet<Entity>();
  #entitiesById = new NumberKeyedMap<Entity>();
  #entitiesWithComponent = new Map<IComponentDefinition<any>, ObservableSet<Entity>>();
  #componentsWithEntity = new Map<Entity, Set<IComponentDefinition<any>>>();

  get entities() {
    return this.#entities;
  }

  #getNextId(): number {
    return this.#entitiesById.size;
  }

  addEntity(entity = new Entity(this, this.#getNextId())): Entity {
    const {world, id} = getEntityMeta(entity);
    invariant(world === this, `Entity is from a different world`);
    this.#entities.add(entity);
    this.#entitiesById.set(id, entity);
    return entity;
  }

  getEntity(id: number): Entity | undefined {
    return this.#entitiesById.get(id);
  }

  removeEntity(entity: Entity) {
    const { components } = getEntityMeta(entity);

    for (const component of components) {
      component.remove(entity);
    }

    components.clear();

    this.#entities.remove(entity);
  }

  _addComponent(entity: Entity, component: IComponentDefinition<any>) {
    const entities = this.#entitiesWithComponent.get(component) ?? new ObservableSet<Entity>();
    const components = this.#componentsWithEntity.get(entity) ?? new Set<IComponentDefinition<any>>();
    entities.add(entity);
    components.add(component);
    this.#entitiesWithComponent.set(component, entities);
    this.#componentsWithEntity.set(entity, components);
  }

  _removeComponent(entity: Entity, component: IComponentDefinition<any>) {
    const entities = this.#entitiesWithComponent.get(component);
    const components = this.#componentsWithEntity.get(entity);
    if (entities) {
      entities.remove(entity);
      if (entities.size === 0) {
        this.#entitiesWithComponent.delete(component);
      }
    }
    if (components) {
      components.delete(component);
      if (components.size === 0) {
        this.#componentsWithEntity.delete(entity);
      }
    }
  }

  getEntitiesWith<T extends IComponentDefinition<any>>(component: T): IReadonlyObservableSet<Entity> {
    return this.#entitiesWithComponent.get(component) ?? ObservableSet.empty;
  }

  getComponentsWith(entity: Entity): ReadonlySet<IComponentDefinition<any>> {
    return this.#componentsWithEntity.get(entity) ?? emptySet;
  }

  registerComponent(component: IComponentDefinition<any>) {
    component.entities.onAdd((entity) => {
      invariant(isEntity(entity), `Entity is missing metadata`);
      const meta = getEntityMeta(entity);
      meta.components.add(component);
    });
  }
}

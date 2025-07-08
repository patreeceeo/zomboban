import {NumberKeyedMap} from "./collections";
import { EntityWithComponents, IComponentDefinition } from "./Component";
import { Entity, getEntityMeta } from "./Entity";
import { invariant } from "./Error";
import { IObservableSet, IReadonlyObservableSet, ObservableSet } from "./Observable";
import {IQueryPredicate} from "./Query";
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
  #entitiesWithComponent = new Map<IQueryPredicate<any>, ObservableSet<Entity>>();
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
    const components = this.getComponentsWith(entity);

    for (const component of components) {
      component.remove(entity);
    }

    this.#entities.remove(entity);
  }

  _addEntityForQueryPredicate(entity: Entity, predicate: IQueryPredicate<any>) {
    const entities = this.#entitiesWithComponent.get(predicate) ?? new ObservableSet<Entity>();
    entities.add(entity);
    this.#entitiesWithComponent.set(predicate, entities);
  }

  _removeEntityForQueryPredicate(entity: Entity, predicate: IQueryPredicate<any>) {
    const entities = this.#entitiesWithComponent.get(predicate);
    if (entities) {
      entities.remove(entity);
    }
  }

  _addComponent(entity: Entity, component: IComponentDefinition<any>) {
    this._addEntityForQueryPredicate(entity, component);
    const components = this.#componentsWithEntity.get(entity) ?? new Set<IComponentDefinition<any>>();
    components.add(component);
    this.#componentsWithEntity.set(entity, components);
  }

  _removeComponent(entity: Entity, component: IComponentDefinition<any>) {
    this._removeEntityForQueryPredicate(entity, component);
    const components = this.#componentsWithEntity.get(entity);
    if (components) {
      components.delete(component);
    }
  }

  getEntitiesWith<T extends IQueryPredicate<any>>(component: T): IReadonlyObservableSet<EntityWithComponents<T>> {
    const result = this.#entitiesWithComponent.get(component) ?? new ObservableSet<any>();
    this.#entitiesWithComponent.set(component, result);
    return result as IReadonlyObservableSet<EntityWithComponents<T>>;
  }

  getComponentsWith(entity: Entity): ReadonlySet<IComponentDefinition<any>> {
    return this.#componentsWithEntity.get(entity) ?? emptySet;
  }

  reset() {
    this.#entities.clear();
    this.#entitiesById.clear();
    this.#entitiesWithComponent.clear();
    for(const [entity, components] of this.#componentsWithEntity) {
      for(const component of components) {
        component.remove(entity);
      }
    }
    this.#componentsWithEntity.clear();
  }
}

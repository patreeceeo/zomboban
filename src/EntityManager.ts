import {NumberKeyedMap} from "./collections";
import { IComponentDefinition } from "./Component";
import { Entity, getEntityMeta, isEntity } from "./Entity";
import { invariant } from "./Error";
import { IObservableSet, IReadonlyObservableSet, ObservableSet } from "./Observable";

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
  #entitiesWithComponents = new Map<IComponentDefinition<any>, ObservableSet<Entity>>();

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
    const set = this.#entitiesWithComponents.get(component) ?? new ObservableSet<Entity>();
    set.add(entity);
    this.#entitiesWithComponents.set(component, set);
  }

  _removeComponent(entity: Entity, component: IComponentDefinition<any>) {
    const set = this.#entitiesWithComponents.get(component);
    if (set) {
      set.remove(entity);
      if (set.size === 0) {
        this.#entitiesWithComponents.delete(component);
      }
    }
  }

  getEntitiesWith<T extends IComponentDefinition<any>>(component: T): IReadonlyObservableSet<Entity> {
    return this.#entitiesWithComponents.get(component) ?? ObservableSet.empty;
  }

  registerComponent(component: IComponentDefinition<any>) {
    component.entities.onAdd((entity) => {
      invariant(isEntity(entity), `Entity is missing metadata`);
      const meta = getEntityMeta(entity);
      meta.components.add(component);
    });
  }
}

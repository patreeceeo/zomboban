import {NumberKeyedMap} from "./collections";
import { IComponentDefinition } from "./Component";
import { Entity, getEntityMeta, isEntity } from "./Entity";
import { invariant } from "./Error";
import { IObservableSet, ObservableSet } from "./Observable";

export interface IEntityFactory<W extends IWorld, E extends Entity> {
  (world: W): E;
}

export interface IWorld {
  entities: IObservableSet<Entity>;
  addEntity(): Entity;
  removeEntity(entity: Entity): void;
}

export class World implements IWorld {
  #entities = new ObservableSet<Entity>();
  #entitiesById = new NumberKeyedMap<Entity>();

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

  removeEntity(entity: Entity) {
    const { components } = getEntityMeta(entity);

    for (const component of components) {
      component.remove(entity);
    }

    components.clear();

    this.#entities.remove(entity);
  }

  registerComponent(component: IComponentDefinition<any>) {
    component.entities.onAdd((entity) => {
      invariant(isEntity(entity), `Entity is missing metadata`);
      const meta = getEntityMeta(entity);
      meta.components.add(component);
    });
  }
}

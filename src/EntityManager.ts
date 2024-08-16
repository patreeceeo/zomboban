import { IComponentDefinition } from "./Component";
import { ENTITY_META_PROPERTY, Entity, EntityMeta } from "./Entity";
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

  get entities() {
    return this.#entities;
  }

  addEntity(): Entity {
    const entity = new Entity();
    this.#entities.add(entity);
    return entity;
  }

  removeEntity(entity: Entity) {
    const meta = entity[ENTITY_META_PROPERTY];

    const components = meta.components as Set<IComponentDefinition<any>>;

    for (const component of components) {
      component.remove(entity);
    }

    components.clear();

    this.#entities.remove(entity);
  }

  registerComponent(component: IComponentDefinition<any>) {
    component.entities.onAdd((entity) => {
      invariant(ENTITY_META_PROPERTY in entity, `Entity is missing metadata`);
      const meta = entity[ENTITY_META_PROPERTY] as EntityMeta;
      meta.components.add(component);
    });
  }
}

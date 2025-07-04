import {IComponentDefinition} from "./Component";
import {World} from "./EntityManager";

const ENTITY_META_PROPERTY = Symbol("entity_meta");

export class EntityMeta {
  components = new Set<IComponentDefinition<any>>();
  constructor(readonly world: World) {}
}

let _nextId = 0;
const entityToId = new WeakMap<Entity, number>();

export class Entity {
  [ENTITY_META_PROPERTY]: EntityMeta;
  constructor(world: World) {
    entityToId.set(this, _nextId++);
    this[ENTITY_META_PROPERTY] = new EntityMeta(world);
  }
  toString() {
    return `Entity ${entityToId.get(this)}`;
  }
}

export function isEntity(entity: any): entity is Entity {
  return ENTITY_META_PROPERTY in entity;
}

export function getEntityMeta(entity: Entity): EntityMeta {
  return entity[ENTITY_META_PROPERTY];
}

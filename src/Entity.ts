import {World} from "./EntityManager";

const ENTITY_META_PROPERTY = Symbol("entity_meta");

export class EntityMeta {
  constructor(readonly world: World, readonly id: number) {}
}

export class Entity {
  [ENTITY_META_PROPERTY]: EntityMeta;
  constructor(world: World, id: number) {
    this[ENTITY_META_PROPERTY] = new EntityMeta(world, id);
  }
  toString() {
    return `Entity ${getEntityMeta(this).id}`;
  }
}

export function isEntity(entity: any): entity is Entity {
  return ENTITY_META_PROPERTY in entity;
}

export function getEntityMeta(entity: Entity): EntityMeta {
  return entity[ENTITY_META_PROPERTY];
}

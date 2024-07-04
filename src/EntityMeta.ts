import { IComponentDefinition } from "./Component";

const ENTITY_META_PROPERTY = Symbol("entity_meta");

export class EntityMeta {
  components = new Set<IComponentDefinition<any>>();
  static has(entity: any) {
    return entity !== undefined && ENTITY_META_PROPERTY in entity;
  }
  static set(entity: any, meta = new EntityMeta()) {
    entity[ENTITY_META_PROPERTY] = meta;
  }
  static get(entity: any): EntityMeta {
    return entity[ENTITY_META_PROPERTY];
  }
}

export interface IEntityWithMeta {
  [ENTITY_META_PROPERTY]: EntityMeta;
}

const ENTITY_META_PROPERTY = Symbol("entity_meta");

export class EntityMeta<ComponentDefinition> {
  components = new Set<ComponentDefinition>();
  static has(entity: any) {
    return ENTITY_META_PROPERTY in entity;
  }
  static set(entity: any, meta = new EntityMeta()) {
    entity[ENTITY_META_PROPERTY] = meta;
  }
  static get(entity: any): EntityMeta<any> {
    return entity[ENTITY_META_PROPERTY];
  }
}

export interface IEntityWithMeta<ComponentDefinition> {
  [ENTITY_META_PROPERTY]: EntityMeta<ComponentDefinition>;
}

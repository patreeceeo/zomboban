export const ENTITY_META_PROPERTY = Symbol("entity_meta");

export class EntityMeta {
  components = new Set<any>();
}

let _nextId = 0;
const entityToId = new WeakMap<Entity, number>();

export class Entity {
  constructor() {
    entityToId.set(this, _nextId++);
  }
  [ENTITY_META_PROPERTY] = new EntityMeta();
  toString() {
    return `Entity ${entityToId.get(this)}`;
  }
}

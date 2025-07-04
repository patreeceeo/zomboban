import {IComponentDefinition} from "./Component";
import {World} from "./EntityManager";

export const ENTITY_META_PROPERTY = Symbol("entity_meta");

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

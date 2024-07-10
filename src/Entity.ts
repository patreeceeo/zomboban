export const ENTITY_META_PROPERTY = Symbol("entity_meta");

export class EntityMeta {
  components = new Set<any>();
}

export class Entity {
  [ENTITY_META_PROPERTY] = new EntityMeta();
  toString() {
    const meta = this[ENTITY_META_PROPERTY];
    const componentStrings = [];
    for (const component of meta.components) {
      componentStrings.push(component.toString());
    }
    return `Entity with ${componentStrings.join(", ")}`;
  }
}

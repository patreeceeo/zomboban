import {
  HasComponent,
  IReadonlyComponentDefinition,
  EntityWithComponents
} from "./Component";
import { isProduction, setDebugAlias } from "./Debug";
import {
  IReadonlyObservableCollection,
  InverseObservalbeCollection,
  ObservableCollection
} from "./Observable";

export class QueryManager {
  query<Components extends IReadonlyComponentDefinition<any>[]>(
    components: Components
  ) {
    return new QueryResults(components);
  }
}

export type IQueryResults<
  Components extends IReadonlyComponentDefinition<any>
> = QueryResults<Components[]>;

class QueryResults<Components extends IReadonlyComponentDefinition<any>[]>
  implements
    IReadonlyObservableCollection<EntityWithComponents<Components[number]>>
{
  #components: IReadonlyComponentDefinition<any>[];
  #entities = new ObservableCollection<
    EntityWithComponents<Components[number]>
  >();
  set debug(value: boolean) {
    this.#entities.debug = value;
    for (const component of this.#components) {
      component.entities.debug = value;
    }
  }
  constructor(components: Components) {
    this.#components = components;
    if (!isProduction()) {
      setDebugAlias(this.#entities, `${this}.entities`);
    }
    // TODO(perf) obviously not as efficient as it could be. Plan: use the manager to reduce recalculation via a tree structure and a dynamic programming approach
    // but this is fine for now because I don't expect to be adding/removing components often, just adding a set of components when creating an entity and
    // removing those components when destroying an entity.
    for (const component of components) {
      const notComponent = Not(component);
      component.entities.stream((entity) => {
        if (this.debug) {
          console.log(
            "added",
            (entity as any).name,
            "to",
            component.toString()
          );
        }
        if (this.has(entity)) {
          if (this.debug) {
            console.log("added", (entity as any).name, "to", this.toString());
          }
          this.#entities.add(entity);
        }
      });
      component.entities.onRemove((entity) => {
        if (this.debug) {
          console.log(
            "removed",
            (entity as any).name,
            "from",
            component.toString()
          );
        }
        if (this.#entities.has(entity) && !this.has(entity)) {
          if (this.debug) {
            console.log(
              "removed",
              (entity as any).name,
              "from",
              this.toString()
            );
          }
          this.#entities.remove(entity);
        }
      });

      if (notComponent) {
        notComponent.entities.onRemove((entity) => {
          if (this.debug) {
            console.log(
              "removed",
              (entity as any).name,
              "from",
              notComponent.toString()
            );
          }
          if (this.has(entity)) {
            if (this.debug) {
              console.log("added", (entity as any).name, "to", this.toString());
            }
            this.#entities.add(entity);
          }
        });
      }
    }
  }
  toString() {
    return `Query(${this.#components.map((c) => c.toString()).join(", ")})`;
  }
  [Symbol.iterator](): IterableIterator<
    EntityWithComponents<Components[number]>
  > {
    return this.#entities[Symbol.iterator]();
  }
  has(entity: EntityWithComponents<Components[number]>) {
    // const results = this.#components.map((c) => [
    //   c.toString(),
    //   c.has(entity as any)
    // ]);
    // console.log(
    //   "for entity",
    //   (entity as any).name,
    //   this.toString(),
    //   "has",
    //   JSON.stringify(results, null, 3)
    // );
    return this.#components.every((c) => c.has(entity as any));
  }
  onAdd(observer: (entity: EntityWithComponents<Components[number]>) => void) {
    return this.#entities.onAdd(observer);
  }
  onRemove(
    observer: (entity: EntityWithComponents<Components[number]>) => void
  ) {
    return this.#entities.onRemove(observer);
  }
  stream(callback: (entity: EntityWithComponents<Components[number]>) => void) {
    return this.#entities.stream(callback);
  }
}

const _notComponents = new WeakMap<
  IReadonlyComponentDefinition<any>,
  IReadonlyComponentDefinition<any>
>();

export function Not<Component extends IReadonlyComponentDefinition<any>>(
  component: Component
): Component {
  // reuse existing Not(Component) if it exists
  const notComponent =
    (_notComponents.get(component) as Component) ??
    ({
      toString() {
        return `Not(${component.toString()})`;
      },
      has<E extends {}>(entity: E) {
        return !component.has(entity);
      },
      entities: new InverseObservalbeCollection(
        component.entities
      ) as IReadonlyObservableCollection<HasComponent<{}, Component>>
    } as Component);

  _notComponents.set(component, notComponent);
  _notComponents.set(notComponent, component);

  return notComponent;
}

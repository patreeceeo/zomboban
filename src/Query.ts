import {
  HasComponent,
  IReadonlyComponentDefinition,
  EntityWithComponents,
  IComponentDefinition
} from "./Component";
import { isProduction, setDebugAlias } from "./Debug";
import {
  IObservableObject,
  IReadonlyObservableSet,
  InverseObservalbeSet as InverseObservableSet,
  ObservableSet,
  OnChangeKey
} from "./Observable";
import { Rectangle } from "./Rectangle";

interface QueryTreeNode {
  queryResults: QueryResults<any>;
  children: QueryTree;
}

type QueryTree = Map<IReadonlyComponentDefinition<any>, QueryTreeNode>;

export interface IQueryOptions {
  memoize: boolean;
}

const defaultQueryOptions: IQueryOptions = {
  memoize: true
};

export class QueryManager {
  #knownComponents = [] as IReadonlyComponentDefinition<any>[];
  #queryTree = new Map() as QueryTree;
  query<Components extends IReadonlyComponentDefinition<any>>(
    components: Components[],
    options = defaultQueryOptions
  ): IQueryResults<Components> {
    if (options.memoize) {
      // Instead of simply returning a new `QueryResults` on every call, we can memoize the results
      // First, ensure that we're always using the same order of components
      for (const component of components) {
        if (!this.#knownComponents.includes(component)) {
          this.#knownComponents.push(component);
        }
      }
      const sortedComponents = components
        .slice()
        .sort(
          (a, b) =>
            this.#knownComponents.indexOf(a) - this.#knownComponents.indexOf(b)
        );

      // Then, we can use the sorted components to traverse the query tree
      let queryTree = this.#queryTree;
      for (const [componentIndex, component] of sortedComponents.entries()) {
        let nextNode = queryTree.get(component);
        if (nextNode === undefined) {
          nextNode = {
            queryResults: new QueryResults(
              sortedComponents.slice(0, componentIndex + 1)
            ),
            children: new Map()
          };
          queryTree.set(component, nextNode);
        }
        if (component !== sortedComponents.at(-1)) {
          queryTree = nextNode.children;
        } else {
          // If we've reached the last component, we can return the query results
          return nextNode.queryResults;
        }
      }
      throw "Failed to use query tree to find/create query results";
    } else {
      return new QueryResults(components);
    }
  }
}

export type IQueryResults<
  Components extends IReadonlyComponentDefinition<any>
> = QueryResults<Components[]>;

class QueryResults<Components extends IReadonlyComponentDefinition<any>[]>
  implements IReadonlyObservableSet<EntityWithComponents<Components[number]>>
{
  #components: IReadonlyComponentDefinition<any>[];
  #entities = new ObservableSet<EntityWithComponents<Components[number]>>();
  debug = false;
  // set debug(value: boolean) {
  //   this.#entities.debug = value;
  //   for (const component of this.#components) {
  //     component.entities.debug = value;
  //   }
  // }
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
  get size() {
    return this.#entities.size;
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
      entities: new InverseObservableSet(
        component.entities
      ) as IReadonlyObservableSet<HasComponent<{}, Component>>
    } as Component);

  _notComponents.set(component, notComponent);
  _notComponents.set(notComponent, component);

  return notComponent;
}

export function Some<Components extends IReadonlyComponentDefinition<any>[]>(
  ...components: Components
): IReadonlyComponentDefinition<any> {
  const entities = new ObservableSet(
    components.flatMap((c) => Array.from(c.entities))
  );

  for (const component of components) {
    component.entities.onAdd((entity) => {
      entities.add(entity);
    });
    component.entities.onRemove((entity) => {
      if (!components.some((c) => c.has(entity))) {
        entities.remove(entity);
      }
    });
  }

  return {
    toString() {
      return `Some(${components.map((c) => c.toString()).join(", ")})`;
    },
    has<E extends {}>(entity: E) {
      return components.some((c) => c.has(entity));
    },
    entities: entities as IReadonlyObservableSet<HasComponent<{}, any>>
  } as IReadonlyComponentDefinition<any>;
}

export function Changed<Component extends IReadonlyComponentDefinition<any>>(
  component: Component
): IComponentDefinition<any> {
  const entities = new ObservableSet<{}>();
  component.entities.onAdd((entity) => {
    // TODO test with a non-observable entity
    // TODO collect subscriptions and be wary of memory leaks
    if (OnChangeKey in entity) {
      (entity as IObservableObject<any>)[OnChangeKey]((key) => {
        if (component.hasProperty(key as string)) {
          entities.add(entity);
        }
      });
    }
  });
  // TODO instead of memoizing here, let the caller re-use the result if they want to
  // that way, each caller can independently track changes to the component
  return {
    toString() {
      return `Changed(${component.toString()})`;
    },
    has<E extends {}>(entity: E): entity is E & HasComponent<E, Component> {
      return entities.has(entity);
    },
    entities,
    remove<E extends {}>(entity: E) {
      entities.remove(entity);
      return entity;
    },
    clear() {
      entities.clear();
    },
    hasProperty(key: string) {
      return component.hasProperty(key);
    },
    add<E extends {}>(entity: E): entity is E & HasComponent<E, Component> {
      void entity;
      throw "not implemented";
    },
    serialize<E extends {}>(entity: E, target: any) {
      void entity;
      void target;
      throw "not implemented";
    },
    canDeserialize(data: any) {
      void data;
      return false;
    }
  };
}

export function WithinArea<
  E extends { position: V },
  V extends { x: number; y: number },
  Ctor extends IConstructor<E>
>(rect: Rectangle): IReadonlyComponentDefinition<Ctor> {
  return {
    toString() {
      return `WithinArea(${rect.toString()})`;
    },
    has<O extends {}>(entity: O): entity is O & InstanceType<Ctor> {
      if ("position" in entity) {
        const { position } = entity as InstanceType<Ctor>;
        return rect.intersectsPoint(position.x, position.y);
      }
      return false;
    },
    hasProperty(key: string) {
      void key;
      return false;
    },
    canDeserialize(data: any) {
      void data;
      return false;
    },
    entities: new ObservableSet()
  };
}

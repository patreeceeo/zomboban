import {
  EntityWithComponents,
  IComponentDefinition
} from "./Component";
import { isProduction, setDebugAlias } from "./Debug";
import {Entity} from "./Entity";
import { IReadonlyObservableSet, ObservableSet } from "./Observable";
import { World } from "./EntityManager";

export interface IQueryPredicate<Data> {
  has<E extends Entity>(entity: E): entity is E & Data;
  // TODO perhaps the `has` method should first check if the entity exists in its collection, then duck type the entity. Then this method could be removed.
  hasProperty(key: string): boolean;
  toString(): string;
}

interface QueryTreeNode {
  queryResults: QueryResults<any>;
  children: QueryTree;
}

type QueryTree = Map<IQueryPredicate<any>, QueryTreeNode>;

export interface IQueryOptions {
  memoize: boolean;
}

export class QueryManager {
  #knownComponents = [] as IQueryPredicate<any>[];
  #queryTree = new Map() as QueryTree;
  constructor(readonly world: World) {}
  
  query<Components extends readonly IQueryPredicate<any>[]>(
    components: Components
  ): IQueryResults<Components> {
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
        const nextNodeComponents = sortedComponents.slice(
          0,
          componentIndex + 1
        );
        nextNode = {
          queryResults: new QueryResults(nextNodeComponents, this.world),
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
  }
}

export class NoMemoQueryManager extends QueryManager {
  constructor(world: World) {
    super(world);
  }
  query<Components extends readonly IQueryPredicate<any>[]>(
    components: Components
  ): IQueryResults<Components> {
    return new QueryResults(components, this.world);
  }
}

export type IQueryResults<
  Components extends readonly IQueryPredicate<any>[]
> = QueryResults<Components>;

class QueryResults<
  Components extends readonly IQueryPredicate<any>[]
> implements IReadonlyObservableSet<EntityWithComponents<Components[number]>>
{
  #components: readonly IQueryPredicate<any>[];
  #entities = new ObservableSet<EntityWithComponents<Components[number]>>();
  debug = false;
  // set debug(value: boolean) {
  //   this.#entities.debug = value;
  //   for (const component of this.#components) {
  //     component.entities.debug = value;
  //   }
  // }
  constructor(components: Components, world: World) {
    this.#components = components;
    if (!isProduction()) {
      setDebugAlias(this.#entities, `${this}.entities`);
    }
    // TODO(perf) obviously not as efficient as it could be. Plan: use the manager to reduce recalculation via a tree structure and a dynamic programming approach
    // but this is fine for now because I don't expect to be adding/removing components often, just adding a set of components when creating an entity and
    // removing those components when destroying an entity.
    for (const component of components) {
      // TODO unsubscribe
      const entities = world.getEntitiesWith(component);
      entities.stream(this.#handleAddOrRemove);
      // TODO unsubscribe
      entities.onRemove(this.#handleAddOrRemove);
    }
  }

  #handleAddOrRemove = (entity: EntityWithComponents<Components[number]>) => {
    // console.log(`Handling add or remove for entity ${entity} in query ${this}. This query ${this.has(entity) ? "should have" : "should not have"} the entity, while the entities set ${this.#entities.has(entity) ? "has" : "does not have"} the entity.`);
    if(this.has(entity)) {
      // console.log(`Adding entity ${entity} to query ${this}`);
      this.#entities.add(entity);
    }

    if (this.#entities.has(entity) && !this.has(entity)) {
      // console.log(`Removing entity ${entity} from query ${this}`);
      this.#entities.remove(entity);
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
    //   `for entity ${entity} in query`,
    //   this.toString(),
    //   "has",
    //   JSON.stringify(results, null, 3)
    // );
    return this.#components.every((c) => c.has(entity));
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

interface Operand<T extends IConstructor<any>>
  extends IQueryPredicate<T> {
  op: "not" | "some";
}

export function Not<Component extends IComponentDefinition<any>>(
  component: Component,
  world: World
): Operand<never> {

  const notComponent: Operand<any> = {
    op: "not",
    toString() {
      return `Not(${component.toString()})`;
    },
    has<E extends Entity>(entity: E) {
      return !component.has(entity);
    },
    hasProperty(key: string) {
      return !component.hasProperty(key);
    }
  }

  const componentEntities = world.getEntitiesWith(component);
  componentEntities.stream((entity) => {
    world._addEntityForQueryPredicate(entity, notComponent);
  });
  componentEntities.onRemove((entity) => {
    world._removeEntityForQueryPredicate(entity, notComponent);
  });

  return notComponent;
}


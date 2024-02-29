import {
  HasComponent,
  ComponentBase,
  ComponentConstructor,
  ComponentRegistry,
  IReadonlyComponentDefinition
} from "./Component";
import { Executor, ExecutorBuilder } from "./Executor";
import {
  IReadonlyObservableCollection,
  InverseObservalbeCollection,
  ObserableCollection
} from "./Observable";

export class QueryManager<
  Components extends IReadonlyComponentDefinition<any>[]
> {
  #components: Components;
  constructor(components: Components) {
    // automatically register the Not(Component) for each component
    this.#components = components.reduce((acc, component) => {
      acc.push(component);
      acc.push(Not(component));
      return acc;
    }, [] as IReadonlyComponentDefinition<any>[]) as Components;
  }

  query(components: Components) {
    for (const component of components) {
      if (!this.#components.includes(component)) {
        throw new Error(`Component not registered: ${component}`);
      }
    }
    return new QueryResults(components);
  }
}

export type EntityWithComponents<
  Components extends IReadonlyComponentDefinition<any>[]
> = UnionToIntersection<HasComponent<{}, Components[number]>>;

class QueryResults<Components extends IReadonlyComponentDefinition<any>[]>
  implements IReadonlyObservableCollection<EntityWithComponents<Components>>
{
  #components: IReadonlyComponentDefinition<any>[];
  #entities = new ObserableCollection<EntityWithComponents<Components>>();
  constructor(components: Components) {
    this.#components = components;
    // TODO(perf) obviously not as efficient as it could be. Plan: use the manager to reduce recalculation via a tree structure and a dynamic programming approach
    // but this is fine for now because I don't expect to be adding/removing components often, just adding a set of components when creating an entity and
    // removing those components when destroying an entity.
    for (const component of components) {
      component.entities.stream((entity) => {
        if (this.has(entity)) {
          this.#entities.add(entity);
        }
      });
      component.entities.onRemove((entity) => {
        if (!this.has(entity) && this.#entities.has(entity)) {
          this.#entities.remove(entity);
        }
      });
    }
  }
  [Symbol.iterator](): IterableIterator<EntityWithComponents<Components>> {
    return this.#entities[Symbol.iterator]();
  }
  has(entity: EntityWithComponents<Components>) {
    return this.#components.every((c) => c.has(entity as any));
  }
  onAdd(observer: (entity: EntityWithComponents<Components>) => void): void {
    this.#entities.onAdd(observer);
  }
  onRemove(observer: (entity: EntityWithComponents<Components>) => void): void {
    this.#entities.onRemove(observer);
  }
  stream(callback: (entity: EntityWithComponents<Components>) => void) {
    this.#entities.stream(callback);
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
      has<E extends {}>(entity: E) {
        return !component.has(entity);
      },
      entities: new InverseObservalbeCollection(
        component.entities
      ) as IReadonlyObservableCollection<HasComponent<{}, Component>>
    } as Component);

  _notComponents.set(component, notComponent);

  return notComponent;
}

/*
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * TODO remove old code
 */

type Filter = (entityId: number) => boolean;

/** @deprecated */
export function executeFilterQuery(
  fn: Filter,
  results: Array<number>,
  entityIds: Enumerable<number>
): ReadonlyArray<number> {
  for (const entityId of entityIds) {
    if (entityId !== undefined && fn(entityId)) {
      results.push(entityId);
    }
  }
  return results;
}

export function not<Args extends any[]>(
  fn: (...args: Args) => boolean
): (...args: Args) => boolean {
  return (...args: Args) => !fn(...args);
}

export function and<Args extends any[]>(
  ...fns: Array<(...args: Args) => boolean>
): (...args: Args) => boolean {
  return (...args: Args) => fns.every((fn) => fn(...args));
}

type WithEntityId<Params extends Record<string, any>> = Params & {
  entityId: number;
};

class QueryBuilder<Params extends Record<string, any> = {}> {
  #builder: ExecutorBuilder<WithEntityId<Params>, boolean>;
  #source: EntitySource;
  constructor(
    source: EntitySource,
    readonly name: string,
    builder = Executor.build<Params, boolean>(`${name} Query`)
  ) {
    this.#source = source;
    this.#builder = builder.addParam("entityId", 0);
  }
  addParam<NewParamType, NewParamName extends string>(
    name: NewParamName,
    defaultValue: NewParamType
  ): QueryBuilder<
    ExtendRecord<WithEntityId<Params>, NewParamName, NewParamType>
  > {
    return new QueryBuilder(
      this.#source,
      this.name,
      this.#builder.addParam(name, defaultValue)
    );
  }
  complete(
    filter: GenericFunction<[WithEntityId<Params>], boolean> = () => true
  ) {
    const q = new Query(this.#source, this.#builder.complete(filter));
    return Object.assign(q.execute, q);
  }
}

interface EntitySource {
  get(): Enumerable<number>;
  name?: string;
}

interface QueryResultsOld extends Enumerable<number> {
  length: number;
  at(index: number): number | undefined;
}

// TODO(perf: to be tested): can use a separate parameter for entityId and have the rest of the args in an object as the 2nd parameter? or maybe each arg as a separate parameter?
export class Query<Params extends WithEntityId<Record<string, any>>> {
  #source: EntitySource;
  #executor: Executor<Params, boolean>;
  #results: number[] = [];
  static build(source: EntitySource, name = source.name ?? "Anonymous") {
    return new QueryBuilder(source, name);
  }
  static buildWithComponentFilterEntitySource(
    componentRegistry: ComponentRegistry,
    filterRegistry: ComponentFilterRegistry,
    componentKlasses: ComponentConstructor<any>[],
    existingEntities: Enumerable<number>,
    name?: string
  ) {
    const filterId = filterRegistry.register(
      new ComponentFilterEntitySource(
        componentKlasses.map((klass) => componentRegistry.get(klass))
      )
    );
    const filter = filterRegistry.get(filterId);
    for (const entityId of existingEntities) {
      filter.handleAdd(entityId);
    }
    // console.log("registering filter", filterId, filter.name);
    return new QueryBuilder(filter, name ?? filter.name);
  }
  constructor(source: EntitySource, executor: Executor<Params, boolean>) {
    this.#source = source;
    this.#executor = executor;
  }
  setParam = <ParamName extends keyof Params>(
    param: ParamName,
    value: Params[ParamName]
  ): Query<Params> => {
    this.#executor.setArg(param, value);
    return this;
  };
  execute = (): QueryResultsOld => {
    const entities = this.#source.get();
    const results = this.#results;
    const executor = this.#executor;
    const execute = executor.execute;
    executor.checkArgs(executor.paramCount - 1);
    results.length = 0;
    for (const entityId of entities) {
      executor.setArg("entityId", entityId, true);
      if (execute()) {
        results.push(entityId);
      }
    }
    executor.resetArgs();
    return results;
  };
}

export class ComponentFilterEntitySource implements EntitySource {
  #results = new Set<number>();
  #components = [] as ComponentBase<any, any, any>[];
  public name: string;
  get components() {
    return this.#components;
  }
  constructor(components: ComponentBase<any, any, any>[]) {
    this.#components = components.sort((a, b) =>
      a.serialType > b.serialType ? 1 : -1
    );
    this.name = this.#components.map((c) => c.constructor.name).join("+");
  }
  matchesComponents(components: ComponentBase<any, any, any>[]) {
    if (components.length !== this.#components.length) {
      return false;
    }
    for (let i = 0; i < this.#components.length; i++) {
      if (this.#components[i] !== components[i]) {
        return false;
      }
    }
    return true;
  }
  test(entityId: number) {
    const bools = this.#components.map((c) => c.has(entityId));
    // console.log("testing entity", entityId, "for", this.name, "filter", bools);
    return bools.every((b) => b);
  }
  handleAdd(entityId: number) {
    if (this.test(entityId)) {
      // console.log( "adding entity",
      //   entityId,
      //   "to filter results for",
      //   this.name,
      //   "filter",
      // );
      this.#results.add(entityId);
    }
  }
  handleRemove(entityId: number) {
    if (!this.test(entityId)) {
      // console.log(
      //   "removing entity",
      //   entityId,
      //   "from filter results for",
      //   this.name,
      //   "filter"
      // );
      this.#results.delete(entityId);
    }
  }
  get(): Enumerable<number> {
    return this.#results;
  }
}

export class ComponentFilterRegistry {
  #array: ComponentFilterEntitySource[] = [];
  register(filter: ComponentFilterEntitySource) {
    const filters = this.#array;
    const indexByReference = filters.indexOf(filter);
    const indexByComponents = this.lookupWithComponents(filter.components);
    if (indexByReference === -1 && indexByComponents === -1) {
      filters.push(filter);
      return filters.length - 1;
    }
    return indexByReference !== -1 ? indexByReference : indexByComponents;
  }
  get(index: number) {
    return this.#array[index];
  }
  has(index: number) {
    return index >= 0 && index < this.#array.length;
  }
  values() {
    return this.#array as Enumerable<ComponentFilterEntitySource>;
  }
  lookupWithComponents(components: ComponentBase<any, any, any>[]) {
    const filters = this.#array;
    for (let i = 0; i < filters.length; i++) {
      if (filters[i].matchesComponents(components)) {
        return i;
      }
    }
    return -1;
  }
}

// TODO use a tree structure to improve performance?
// const QueryTree = {
//   AComponent: {
//     queries: [
//       {
//         query:
//           ['AComponent', 'BComponent'],
//         queries: [
//           {
//             query:
//               ['AComponent', 'BComponent', 'CComponent'],
//             queries: []
//           },
//           {
//             query:
//               ['AComponent', 'BComponent', 'DComponent'],
//             queries: []
//           },
//         ]
//       },
//       {
//         query:
//           ['AComponent', 'CComponent'],
//         queries: []
//       },
//       {
//         query:
//           ['AComponent', 'DComponent'],
//         queries: []
//       },
//     ]
//   }
// }

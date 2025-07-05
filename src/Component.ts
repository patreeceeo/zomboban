import {invariant} from "./Error";
import {
  IReadonlyObservableSet,
  Observable,
  ObservableSet
} from "./Observable";
import {isProduction, setDebugAlias} from "./Debug";
import {Entity} from "./Entity";
import {IQueryPredicate} from "./Query";


export interface IComponentDefinition<
  // TODO switch the order of these two type parameters
  Data = never,
  TCtor extends IConstructor<any> = new () => {}
> extends IQueryPredicate<InstanceType<TCtor>> {
  add<E extends {}>(
    entity: E,
    data?: Data
  ): asserts entity is E & InstanceType<TCtor>;
  remove<E extends {}>(entity: E): Omit<E, keyof InstanceType<TCtor>>;
  onRemove<E extends EntityWithComponents<this>>(
    callback: (entity: E) => void
  ): void;
  canDeserialize(data: any): boolean;
  serialize<E extends {}>(entity: E & InstanceType<TCtor>, target?: any): Data;
  /** remove all entities from this component */
  clear(): void;
  onDeserialize(callback: (data: Data) => void): void;
}

export interface ISerializable<D> {
  deserialize(entity: any, data: D): void;
  canDeserialize(data: any): boolean;
  serialize(entity: any, target?: any): any;
}

export type EntityWithComponents<
  Components extends IQueryPredicate<any>
> = UnionToIntersection<HasComponent<{}, Components>> & Entity;

type MaybeSerializable<Ctor> = Ctor extends {
  deserialize(entity: any, data: infer D): void;
}
  ? D extends any
  ? Ctor & ISerializable<D>
  : Ctor
  : Ctor;

// TODO removeAll method?
export function defineComponent<
  Ctor extends IConstructor<any> &
  Partial<{deserialize(...args: any[]): void}>,
  Data extends Ctor extends {deserialize(...args: any[]): void}
  ? Parameters<Ctor["deserialize"]>[1]
  : never
>(ctor?: MaybeSerializable<Ctor>): IComponentDefinition<Data, Ctor> {
  const isSerializable = ctor !== undefined && "deserialize" in ctor;
  const serializableCtor = ctor as IConstructor<any> & ISerializable<Data>;
  
  class ComponentDefinition {
    #proto = ctor ? new ctor() : {};
    #deserializeObservable = new Observable<Data>();
    entities = new ObservableSet<InstanceType<Ctor>>();
    
    constructor() {
      if (!isProduction()) {
        setDebugAlias(this.entities, `${this.toString()}.entities`);
        this.entities.onAdd((entity: InstanceType<Ctor>) => {
          invariant(
            ctor === undefined ||
            Object.keys(this.#proto).every((key) => key in entity),
            `Entity is missing a required property for ${this.toString(ctor)}`
          );
        });
      }
    }
    
    toString(_ctor = ctor): string {
      return _ctor
        ? "humanName" in _ctor
          ? (_ctor.humanName as string)
          : _ctor.name
            ? _ctor.name
            : "anonymous component"
        : "anonymous tag";
    }
    
    _defineProperties<E extends {}>(entity: E) {
      const instance = new ctor!();
      for (const key in instance) {
        (entity as any)[key] = instance[key];
      }
    }
    
    _addToCollection<E extends {}>(entity: E) {
      this.entities.add(entity as E & InstanceType<Ctor>);
    }
    
    add<E extends {}>(
      entity: E,
      data?: Data
    ): entity is E & InstanceType<Ctor> {
      if (ctor) this._defineProperties(entity);
      invariant(
        data === undefined || (ctor !== undefined && "deserialize" in ctor),
        "This component does not define a deserialize method, so it cannot accept data parameters."
      );
      
      if (isSerializable && data !== undefined) {
        serializableCtor.deserialize(entity, data);
        this.#deserializeObservable.next(data);
      }
      
      this._addToCollection(entity);
      return true;
    }
    
    remove<E extends {}>(entity: E & InstanceType<Ctor>) {
      this.entities.remove(entity);
      return entity;
    }
    
    onRemove(callback: (entity: any) => void) {
      return this.entities.onRemove(callback);
    }
    
    has<E extends {}>(entity: E): entity is E & InstanceType<Ctor> {
      return this.entities.has(entity as E & InstanceType<Ctor>);
    }
    
    hasProperty(key: string) {
      return key in this.#proto;
    }
    
    serialize<E extends {}>(
      entity: E & InstanceType<Ctor>,
      target = {} as any
    ) {
      invariant(
        ctor !== undefined && "serialize" in ctor,
        "This component does not define a serialize method, so it cannot be serialized."
      );
      return serializableCtor.serialize(entity, target as Data);
    }
    
    canDeserialize(data: any) {
      return isSerializable && serializableCtor.canDeserialize(data);
    }
    
    onDeserialize(callback: (data: Data) => void) {
      this.#deserializeObservable.subscribe(callback);
    }
    
    clear() {
      this.entities.clear();
    }
  }
  
  return new ComponentDefinition() as any;
}

export type HasComponent<
  E extends {},
  D extends IQueryPredicate<any>
> = D extends {
  entities: IReadonlyObservableSet<infer R>;
}
  ? E & R
  : never;

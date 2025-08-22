import {invariant} from "./Error";
import {
  Observable,
} from "./Observable";
import {IQueryPredicate} from "./Query";
import {Entity, getEntityMeta} from "./Entity";

export interface IComponentDefinition<
  // TODO switch the order of these two type parameters
  Data = never,
  TCtor extends IConstructor<any> = new () => {}
> extends IQueryPredicate<InstanceType<TCtor>> {
  add<E extends Entity>(
    entity: E,
    data?: Data
  ): asserts entity is E & InstanceType<TCtor>;
  remove<E extends Entity>(entity: E): Omit<E, keyof InstanceType<TCtor>>;
  onRemove<E extends EntityWithComponents<this>>(
    callback: (entity: E) => void
  ): void;
  canDeserialize(data: any): boolean;
  serialize<E extends Entity>(entity: E & InstanceType<TCtor>, target?: any): Data;
  onDeserialize(callback: (data: Data) => void): void;
}

export interface ISerializable<D> {
  deserialize(entity: any, data: D): void;
  canDeserialize(data: any): boolean;
  serialize(entity: any, target?: any): any;
}

export type HasComponent<
  E extends {},
  D extends IQueryPredicate<any>
> = D extends {
  has(entity: E): entity is E & infer R;
} ? E & R
  : never;

export type EntityWithComponents<
  Components extends IQueryPredicate<any>
> = UnionToIntersection<HasComponent<Entity, Components>> & Entity;

type MaybeSerializable<Ctor> = Ctor extends {
  deserialize(entity: any, data: infer D): void;
}
  ? D extends any
  ? Ctor & ISerializable<D>
  : Ctor
  : Ctor;

const allGuids = new Set<string>();

export function resetComponentRegistry() {
  allGuids.clear();
}

// TODO removeAll method?
export function defineComponent<
  Ctor extends IConstructor<any> &
  Partial<{deserialize(...args: any[]): void}>,
  Data extends Ctor extends {deserialize(...args: any[]): void}
  ? Parameters<Ctor["deserialize"]>[1]
  : never
>(ctor: MaybeSerializable<Ctor>): IComponentDefinition<Data, Ctor> {
  const isSerializable = ctor !== undefined && "deserialize" in ctor;
  const serializableCtor = ctor as IConstructor<any> & ISerializable<Data>;

  const _guid = ctor.name;
  invariant(!allGuids.has(_guid), `Component with name "${_guid}" already defined.`);
  allGuids.add(_guid); // placeholder to prevent recursion
  
  class ComponentDefinition {
    #proto = new ctor()
    #deserializeObservable = new Observable<Data>();
    #removeObservable = new Observable<Entity>();
    
    toString(_ctor = ctor): string {
      return "humanName" in _ctor
        ? (_ctor.humanName as string)
        : _ctor.name
    }

    get guid() {
      return _guid;
    }
    
    _defineProperties<E extends Entity>(entity: E) {
      const instance = new ctor!();
      for (const key in instance) {
        (entity as any)[key] = instance[key];
      }
    }
    
    
    add<E extends Entity>(
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
      
      const {world} = getEntityMeta(entity);
      world._addComponent(entity, this as any);
      return true;
    }
    
    remove<E extends Entity>(entity: E & InstanceType<Ctor>) {
      const {world} = getEntityMeta(entity);
      world._removeComponent(entity, this as any);
      this.#removeObservable.next(entity);
      return entity;
    }
    
    onRemove(callback: (entity: any) => void) {
      this.#removeObservable.subscribe(callback);
    }
    
    has<E extends Entity>(entity: E): entity is E & InstanceType<Ctor> {
      const {world} = getEntityMeta(entity);
      const entitiesWithThisComponent = world.getEntitiesWith(this as any);
      return entitiesWithThisComponent.has(entity);
    }
    
    hasProperty(key: string) {
      return key in this.#proto;
    }
    
    serialize<E extends Entity>(
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
    
  }
  
  return new ComponentDefinition();
}


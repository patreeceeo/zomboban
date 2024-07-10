import { invariant } from "./Error";
import {
  IReadonlyObservableSet,
  Observable,
  ObservableSet
} from "./Observable";
import { isProduction, setDebugAlias } from "./Debug";
import { Entity } from "./Entity";

export interface IReadonlyComponentDefinition<TCtor extends IConstructor<any>> {
  entities: IReadonlyObservableSet<InstanceType<TCtor>>;
  has<E extends {}>(entity: E): entity is E & InstanceType<TCtor>;
  // TODO perhaps the `has` method should first check if the entity exists in its collection, then duck type the entity. Then this method could be removed.
  hasProperty(key: string): boolean;
  canDeserialize(data: any): boolean;
  toString(): string;
}

export interface IComponentDefinition<
  // TODO switch the order of these two type parameters
  Data = never,
  TCtor extends IConstructor<any> = new () => {}
> extends IReadonlyComponentDefinition<TCtor> {
  add<E extends {}>(
    entity: E,
    data?: Data
  ): asserts entity is E & InstanceType<TCtor>;
  remove<E extends {}>(entity: E): Omit<E, keyof InstanceType<TCtor>>;
  onRemove<E extends EntityWithComponents<this>>(
    callback: (entity: E) => void
  ): void;
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
  Components extends IReadonlyComponentDefinition<any>
> = UnionToIntersection<HasComponent<{}, Components>> & Entity;

function Serializable<Ctor extends IConstructor<any>, Data>(
  wrapperCtor: Ctor,
  ctor?: IConstructor<any>
): IConstructor<InstanceType<Ctor> & ISerializable<Data>> {
  const isSerializable = ctor !== undefined && "deserialize" in ctor;
  const serializableCtor = ctor as IConstructor<any> & ISerializable<Data>;
  return class MaybeSerializableComponent extends wrapperCtor {
    #deserializeObservable = new Observable<Data>();
    add<E extends {}>(
      entity: E,
      data?: Data
    ): entity is E & InstanceType<Ctor> {
      if (ctor) super._defineProperties(entity);
      invariant(
        data === undefined || (ctor !== undefined && "deserialize" in ctor),
        "This component does not define a deserialize method, so it cannot accept data parameters."
      );
      // invariant(EntityMeta.has(entity), `Entity is missing metadata`);
      if (isSerializable && data !== undefined) {
        serializableCtor.deserialize(entity, data);
        this.#deserializeObservable.next(data);
      }
      super._addToCollection(entity);
      return true;
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
  };
}

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
    Partial<{ deserialize(...args: any[]): void }>,
  Data extends Ctor extends { deserialize(...args: any[]): void }
    ? Parameters<Ctor["deserialize"]>[1]
    : never
>(ctor?: MaybeSerializable<Ctor>): IComponentDefinition<Data, Ctor> {
  const Component = Serializable(
    class {
      #proto = ctor ? new ctor() : {};
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
      add<E extends {}>(entity: E): entity is E & InstanceType<Ctor> {
        // TODO why is this warning not showing ever?
        // if (this.has(entity as E & InstanceType<Ctor>)) {
        //   console.warn(`Entity already has component ${this.toString()}`);
        // }
        if (ctor) this._defineProperties(entity);
        this._addToCollection(entity);
        return true;
      }
      remove<E extends {}>(entity: E & InstanceType<Ctor>) {
        this.#removeObservable.next(entity);
        this.entities.remove(entity);
        for (const key in this.#proto) {
          delete entity[key];
        }
        return entity;
      }
      #removeObservable = new Observable<any>();
      onRemove(callback: (entity: any) => void) {
        this.#removeObservable.subscribe(callback);
      }
      has<E extends {}>(entity: E): entity is E & InstanceType<Ctor> {
        return this.entities.has(entity as E & InstanceType<Ctor>);
      }
      hasProperty(key: string) {
        return key in this.#proto;
      }
      canDeserialize(data: any) {
        void data;
        return false;
      }
      onDeserialize(cb: (data: never) => void) {
        void cb;
      }
      clear() {
        this.entities.clear();
      }
    },
    ctor
  );
  return new Component();
}

export type HasComponent<
  E extends {},
  D extends IReadonlyComponentDefinition<any>
> = D extends {
  entities: IReadonlyObservableSet<infer R>;
}
  ? E & R
  : never;

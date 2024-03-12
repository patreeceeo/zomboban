import { invariant } from "./Error";
import {
  IReadonlyObservableCollection,
  ObservableCollection
} from "./Observable";
import { isProduction, setDebugAlias } from "./Debug";

export interface IReadonlyComponentDefinition<TCtor extends IConstructor<any>> {
  entities: IReadonlyObservableCollection<InstanceType<TCtor>>;
  has<E extends {}>(entity: E): entity is E & InstanceType<TCtor>;
}

export interface IComponentDefinition<Data, TCtor extends IConstructor<any>>
  extends IReadonlyComponentDefinition<TCtor> {
  _defineProperties<E extends {}>(entity: E): entity is E & InstanceType<TCtor>;
  _addToCollection<E extends {}>(entity: E): void;
  add<E extends {}>(
    entity: E,
    data?: Data
  ): asserts entity is E & InstanceType<TCtor>;
  remove<E extends {}>(entity: E): Omit<E, keyof InstanceType<TCtor>>;
  serialize<E extends {}>(entity: E & InstanceType<TCtor>, target?: any): Data;
  /** remove all entities from this component */
  clear(): void;
}

export interface ISerializable<D> {
  deserialize(entity: any, data: D): void;
  serialize(entity: any, target?: any): any;
}

export type EntityWithComponents<
  Components extends IReadonlyComponentDefinition<any>
> = UnionToIntersection<HasComponent<{}, Components>>;

function Serializable<Ctor extends IConstructor<any>, Data>(
  ctor: IConstructor<any>,
  wrapperCtor: Ctor
): IConstructor<InstanceType<Ctor> & ISerializable<Data>> {
  return class MaybeSerializableComponent extends wrapperCtor {
    add<E extends {}>(
      entity: E,
      data?: Data
    ): entity is E & InstanceType<Ctor> {
      super._defineProperties(entity);
      invariant(
        data === undefined || "deserialize" in ctor,
        "This component does not define a deserialize method, so it cannot accept data parameters."
      );
      if (data && "deserialize" in ctor) {
        (ctor as any).deserialize(entity, data);
      }
      super._addToCollection(entity);
      return true;
    }
    serialize<E extends {}>(
      entity: E & InstanceType<Ctor>,
      target = {} as any
    ) {
      invariant(
        "serialize" in ctor,
        "This component does not define a serialize method, so it cannot be serialized."
      );
      return (ctor as any).serialize(entity, target as Data);
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

// TODO add human friend toString
// TODO removeAll method?
export function defineComponent<
  Ctor extends IConstructor<any> &
    Partial<{ deserialize(...args: any[]): void }>,
  Data extends Ctor extends { deserialize(...args: any[]): void }
    ? Parameters<Ctor["deserialize"]>[1]
    : never
>(ctor: MaybeSerializable<Ctor>): IComponentDefinition<Data, Ctor> {
  const Component = Serializable(
    ctor,
    class {
      #proto = new ctor();
      entities = new ObservableCollection<InstanceType<Ctor>>();
      constructor() {
        if (!isProduction()) {
          setDebugAlias(this.entities, `${this.toString()}.entities`);
          this.entities.onAdd((entity: InstanceType<Ctor>) => {
            invariant(
              Object.keys(this.#proto).every((key) => key in entity),
              `Entity is missing a required property for ${ctor.name}`
            );
          });
        }
      }
      toString() {
        return "humanName" in ctor
          ? ctor.humanName
          : ctor.name
            ? ctor.name
            : "anonymous component";
      }
      _defineProperties<E extends {}>(
        entity: E
      ): entity is E & InstanceType<Ctor> {
        const instance = new ctor();
        Object.defineProperties(entity, {
          ...Object.getOwnPropertyDescriptors(instance),
          ...Object.getOwnPropertyDescriptors(entity)
        }) as E & InstanceType<Ctor>;
        return true;
      }
      _addToCollection<E extends {}>(entity: E) {
        this.entities.add(entity as E & InstanceType<Ctor>);
      }
      add<E extends {}>(entity: E): entity is E & InstanceType<Ctor> {
        this._defineProperties(entity);
        this._addToCollection(entity);
        return true;
      }
      remove<E extends {}>(entity: E & InstanceType<Ctor>) {
        this.entities.remove(entity);
        for (const key in this.#proto) {
          delete entity[key];
        }
        return entity;
      }
      has<E extends {}>(entity: E): entity is E & InstanceType<Ctor> {
        return this.entities.has(entity as E & InstanceType<Ctor>);
      }
      clear() {
        this.entities.clear();
      }
    }
  );
  return new Component();
}

export type HasComponent<
  E extends {},
  D extends IReadonlyComponentDefinition<any>
> = D extends {
  entities: IReadonlyObservableCollection<infer R>;
}
  ? E & R
  : never;

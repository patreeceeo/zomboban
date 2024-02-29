import { invariant } from "./Error";
import { EventDispatcher } from "three";
import {
  IReadonlyObservableCollection,
  ObserableCollection
} from "./Observable";

export interface IReadonlyComponentDefinition<TCtor extends IConstructor<any>> {
  entities: IReadonlyObservableCollection<InstanceType<TCtor>>;
  has<E extends {}>(entity: E): entity is E & InstanceType<TCtor>;
}

export interface IComponentDefinition<TCtor extends IConstructor<any>>
  extends IReadonlyComponentDefinition<TCtor> {
  add<E extends {}>(
    entity: E,
    data?: TCtor extends Serializable<any>
      ? Parameters<TCtor["deserialize"]>[1]
      : never
  ): E & InstanceType<TCtor>;
  remove<E extends {}>(entity: E & InstanceType<TCtor>): E;
  serialize<E extends {}>(
    entity: E & InstanceType<TCtor>
  ): TCtor extends Serializable<any>
    ? Parameters<TCtor["deserialize"]>[1]
    : never;
}

export interface Serializable<D extends {}> {
  deserialize(entity: any, data: D): void;
  serialize(entity: any): D;
}

// TODO add human friend toString
// TODO removeAll method
export function defineComponent<TCtor extends IConstructor<any>>(
  Ctor: TCtor
): IComponentDefinition<TCtor> {
  return new (class {
    #proto = new Ctor();
    entities = new ObserableCollection<InstanceType<TCtor>>();
    constructor() {
      if (process.env.NODE_ENV !== "production") {
        this.entities.onAdd((entity: InstanceType<TCtor>) => {
          invariant(
            Object.keys(this.#proto).every((key) => key in entity),
            `Entity is missing a required property for ${Ctor.name}`
          );
        });
      }
    }
    add<E extends {}>(
      entity: E,
      data?: TCtor extends Serializable<any>
        ? Parameters<TCtor["deserialize"]>[1]
        : never
    ) {
      const instance = new Ctor();
      Object.defineProperties(entity, {
        ...Object.getOwnPropertyDescriptors(instance),
        ...Object.getOwnPropertyDescriptors(entity)
      }) as E & InstanceType<TCtor>;
      this.entities.add(entity as E & InstanceType<TCtor>);
      if (data && "deserialize" in Ctor) {
        (Ctor.deserialize as Serializable<any>["deserialize"])(entity, data);
      }
      return entity as E & InstanceType<TCtor>;
    }
    remove<E extends {}>(entity: E & InstanceType<TCtor>) {
      for (const key in this.#proto) {
        delete entity[key];
      }
      this.entities.remove(entity);
      return entity;
    }
    has<E extends {}>(entity: E): entity is E & InstanceType<TCtor> {
      return this.entities.has(entity as E & InstanceType<TCtor>);
    }
    serialize<E extends {}>(
      entity: E & InstanceType<TCtor>
    ): TCtor extends Serializable<any>
      ? Parameters<TCtor["deserialize"]>[1]
      : never {
      if ("serialize" in Ctor) {
        return (Ctor.serialize as Serializable<any>["serialize"])(entity);
      }
      return null as never;
    }
  })();
}

export type HasComponent<
  E extends {},
  D extends IReadonlyComponentDefinition<any>
> = D extends {
  entities: IReadonlyObservableCollection<infer R>;
}
  ? E & R
  : never;

export interface ComponentConstructor<
  Item,
  SerializedItem = Item,
  Collection = Item[]
> {
  new (...args: any[]): ComponentBase<Item, SerializedItem, Collection>;
}

interface Events<Item> {
  add: { entityId: number; value: Item };
  change: { entityId: number; value: Item };
  remove: { entityId: number };
}

export abstract class ComponentBase<
  Item,
  SerializedItem = Item,
  Collection = Item[]
> extends EventDispatcher<Events<Item>> {
  #derivedHas: typeof ComponentBase.prototype.has;
  #derivedAddSet: typeof ComponentBase.prototype.set;
  #derivedRemove: typeof ComponentBase.prototype.remove;
  #derivedGet: typeof ComponentBase.prototype.get;
  #derivedSerialize: typeof ComponentBase.prototype.serialize;
  constructor(_data: Collection) {
    super();
    this.#derivedHas = this.has;
    this.#derivedAddSet = this.set;
    this.#derivedRemove = this.remove;
    this.#derivedGet = this.get;
    this.#derivedSerialize = this.serialize;

    // TODO all of this monkey patching smells
    this.has = (entityId: number) => {
      this.checkEntityId(entityId);
      return this.#derivedHas(entityId);
    };

    this.set = (entityId: number, value: Item) => {
      this.checkEntityId(entityId);
      const had = this.has(entityId);
      this.#derivedAddSet(entityId, value);
      this.dispatchChange(entityId, value);
      if (!had) {
        this.dispatchAdd(entityId, value);
      }
    };

    this.remove = (entityId: number) => {
      this.checkEntityId(entityId);
      const had = this.has(entityId);
      this.#derivedRemove(entityId);
      if (had) {
        this.dispatchRemove(entityId);
      }
    };

    this.get = (entityId: number, defaultValue?: Item) => {
      this.checkEntityId(entityId);
      this.checkGet(entityId, defaultValue);
      return this.#derivedGet(entityId, defaultValue);
    };

    this.serialize = (entityId: number) => {
      this.checkEntityId(entityId);
      return this.#derivedSerialize(entityId);
    };
  }

  copy(dest: Item, src: Item | SerializedItem) {
    void dest;
    void src;
    throw new Error("Not implemented");
  }

  addMultiEventListener<MultiEvent extends (keyof Events<Item>)[]>(
    events: MultiEvent,
    listener: (event: Events<Item>[MultiEvent[number]]) => void
  ) {
    for (const event of events) {
      this.addEventListener(event, listener);
    }
  }

  // TODO(perf): reuse the same event object
  dispatchChange = (entityId: number, value: Item) => {
    this.dispatchEvent({ type: "change", entityId, value });
  };

  dispatchAdd = (entityId: number, value: Item) => {
    this.dispatchEvent({ type: "add", entityId, value });
  };

  dispatchRemove = (entityId: number) => {
    this.dispatchEvent({ type: "remove", entityId });
  };

  checkEntityId(entityId: number) {
    invariant(typeof entityId === "number", "Entity ID must be a number");
  }

  checkGet(entityId: number, defaultValue?: Item) {
    invariant(
      defaultValue !== undefined || this.has(entityId),
      `Entity ${entityId} has no ${this.humanName}`
    );
  }

  equals(a: Item, b: Item) {
    if (typeof a === "object") {
      console.warn("Comparing non-primitive values via reference equality.");
    }
    return a === b;
  }

  is(entityId: number, value: Item) {
    return this.equals(this.get(entityId), value);
  }

  /** A unique value that can be safely serialized or used as an object key. Not necessarily human-readable. */
  get serialType() {
    return this.constructor.name;
  }

  /** A human-readable name for the component. Does not need to be unique but... */
  get humanName() {
    return this.constructor.name;
  }

  abstract has(entityId: number): boolean;
  abstract get(entityId: number, defaultValue?: Item): Item;

  abstract set(entityId: number, value: Item): void;

  abstract remove(entityId: number): void;
  abstract serialize(entityId: number): SerializedItem;
  abstract deserialize(
    entityId: number,
    value: SerializedItem
  ): void | Promise<void>;

  acquire(entityId: number): this {
    void entityId;
    throw new Error("Not implemented");
  }
}

export abstract class ArrayComponentBase<
  Item,
  SerializedItem = Item
> extends ComponentBase<Item, SerializedItem, Item[]> {
  #data: Item[];

  constructor(data: Item[]) {
    super(data);
    this.#data = data;
    this.has = this.has.bind(this);
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.remove = this.remove.bind(this);
  }

  has(entityId: number) {
    return entityId in this.#data;
  }

  get(entityId: number, defaultValue?: Item) {
    return this.#data[entityId] ?? defaultValue!;
  }

  set(entityId: number, value: Item) {
    invariant(
      value !== undefined && value !== null,
      `Value for ${this.constructor.name} must be defined`
    );
    this.#data[entityId] = value;
  }

  remove(entityId: number) {
    delete this.#data[entityId];
  }
}

export class PrimativeArrayComponent<
  Item,
  SerializedItem = Item
> extends ArrayComponentBase<Item, SerializedItem> {
  constructor(data: Item[]) {
    super(data);
  }

  serialize(entityId: number) {
    this.checkEntityId(entityId);
    this.checkGet(entityId);
    return this.get(entityId) as SerializedItem;
  }

  deserialize(entityId: number, data: SerializedItem) {
    this.checkEntityId(entityId);
    this.set(entityId, data as unknown as Item);
  }
}

/** This could be useful for debugging */
export type Accessor<Object extends {}> = Object & {
  writable: boolean;
};

export function createAccessor<Object extends {}>(object: Object) {
  const objectWithFlag = Object.defineProperty(object, "writable", {
    writable: true
  }) as Accessor<Object>;
  objectWithFlag.writable = false;
  const accessor = new Proxy(objectWithFlag, {
    set(target, prop, value) {
      if (prop === "writable") {
        target.writable = value;
      } else if (!target.writable) {
        throw new Error(`Property ${String(prop)} is not writable`);
      }
      if (prop in target) {
        target[prop as keyof Object] = value;
      }
      return true;
    }
  });
  return accessor as Accessor<Object>;
}

// TODO object pool?
export abstract class ObjectArrayComponent<
  Item extends {},
  SerializedItem = Item
> extends ArrayComponentBase<Item, SerializedItem> {
  constructor(readonly factory: () => Item) {
    super([]);
  }

  abstract copy(dest: Item, src: Item | SerializedItem): void;

  acquire(entityId: number) {
    this.checkEntityId(entityId);
    if (!this.has(entityId)) {
      const value = this.factory();
      super.set(entityId, value);
      this.dispatchAdd(entityId, value);
    }
    return this;
  }

  // set(entityId: number, src: Item) {
  //   this.checkEntityId(entityId);
  //   this.acquire(entityId);
  //   const dest = this.get(entityId);
  //   this.copy(dest, src);
  // }

  serialize(entityId: number) {
    this.checkEntityId(entityId);
    this.checkGet(entityId);
    return super.get(entityId) as unknown as SerializedItem;
  }

  deserialize(entityId: number, src: SerializedItem) {
    this.acquire(entityId);
    this.set(entityId, src as unknown as Item);
  }
}

export class TagComponent extends PrimativeArrayComponent<boolean, any> {
  constructor() {
    super([]);
  }
  get(entityId: number): boolean {
    return super.has(entityId);
  }
  // TODO maybe setting it to false should remove it? that way IsVisible can be a tag component
  set(_entityId: number, value?: boolean) {
    invariant(
      value !== false,
      "A TagComponent can only be set to true. Perhaps you meant to remove it?"
    );
    super.set(_entityId, true);
  }
}

export class ComponentRegistry {
  #entries = {} as Record<string, ComponentBase<any, any>>;
  #onAdd: (
    Component: ComponentConstructor<any>,
    entityId: number,
    value: any
  ) => void;
  #onRemove: (Component: ComponentConstructor<any>, entityId: number) => void;
  constructor(
    onAdd = (
      _Component: ComponentConstructor<any>,
      _entityId: number,
      _value: any
    ) => {},
    onRemove = (_Component: ComponentConstructor<any>, _entityId: number) => {}
  ) {
    this.#onAdd = onAdd;
    this.#onRemove = onRemove;
  }
  register(component: ComponentBase<any, any>) {
    this.#entries[component.serialType] = component;
    component.addEventListener("add", (event) => {
      this.#onAdd(
        component.constructor as ComponentConstructor<any>,
        event.entityId,
        event.value
      );
    });

    component.addEventListener("remove", (event) => {
      this.#onRemove(
        component.constructor as ComponentConstructor<any>,
        event.entityId
      );
    });
  }
  get(klass: ComponentConstructor<any, any>) {
    return this.#entries[klass.name];
  }
  [Symbol.iterator]() {
    return Object.values(this.#entries)[Symbol.iterator]();
  }
}

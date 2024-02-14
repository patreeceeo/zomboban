import { invariant } from "./Error";

export type ComponentConstructor<
  Item,
  Collection = Item[],
  SerializedItem = Item,
> = new (...args: any[]) => ComponentBase<Item, Collection, SerializedItem>;

export abstract class ComponentBase<
  Item,
  Collection = Item[],
  SerializedItem = Item,
> {
  #derivedHas: typeof ComponentBase.prototype.has;
  #derivedAddSet: typeof ComponentBase.prototype.addSet;
  #derivedRemove: typeof ComponentBase.prototype.remove;
  #derivedGet: typeof ComponentBase.prototype.get;
  #derivedSerialize: typeof ComponentBase.prototype.serialize;
  constructor(_data: Collection) {
    this.#derivedHas = this.has;
    this.#derivedAddSet = this.addSet;
    this.#derivedRemove = this.remove;
    this.#derivedGet = this.get;
    this.#derivedSerialize = this.serialize;

    this.has = (entityId: number) => {
      this.checkEntityId(entityId);
      return this.#derivedHas(entityId);
    };

    this.addSet = (entityId: number, value: Item) => {
      this.checkEntityId(entityId);
      const had = this.has(entityId);
      this.#derivedAddSet(entityId, value);
      if (!had) {
        this.onAddSet(entityId, value);
      }
    };

    this.remove = (entityId: number) => {
      this.checkEntityId(entityId);
      const had = this.has(entityId);
      this.#derivedRemove(entityId);
      if (had) {
        this.onRemove(entityId);
      }
    };

    this.get = (entityId: number, defaultValue?: Item) => {
      this.checkEntityId(entityId);
      invariant(
        this.isSaneGet(entityId, defaultValue),
        `Entity ${entityId} has no ${this.constructor.name}`,
      );
      return this.#derivedGet(entityId, defaultValue);
    };

    this.serialize = (entityId: number) => {
      this.checkEntityId(entityId);
      return this.#derivedSerialize(entityId);
    };
  }

  onAddSet = (_entityId: number, _value: Item) => {};
  onRemove = (_entityId: number) => {};

  checkEntityId(entityId: number) {
    invariant(typeof entityId === "number", "Entity ID must be a number");
  }

  isSaneGet(entityId: number, defaultValue?: Item): boolean {
    return defaultValue !== undefined || this.has(entityId);
  }

  is(entityId: number, value: Item) {
    if (typeof value === "object") {
      console.warn("Comparing non-primitive values via reference equality.");
    }
    return this.has(entityId) && this.get(entityId) === value;
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
  abstract addSet(entityId: number, _value: Item): void;
  abstract remove(entityId: number): void;
  abstract serialize(entityId: number): SerializedItem;
  abstract deserialize(
    entityId: number,
    value: SerializedItem,
  ): void | Promise<void>;
}

export abstract class ArrayComponentBase<
  Item,
  SerializedItem = Item,
> extends ComponentBase<Item, Item[], SerializedItem> {
  #data: Item[];

  constructor(data: Item[]) {
    super(data);
    this.#data = data;
    this.has = this.has.bind(this);
    this.get = this.get.bind(this);
    this.addSet = this.addSet.bind(this);
    this.remove = this.remove.bind(this);
  }

  has(entityId: number) {
    return entityId in this.#data;
  }

  get(entityId: number, defaultValue?: Item) {
    return this.#data[entityId] ?? defaultValue!;
  }

  addSet(entityId: number, value: Item) {
    invariant(
      value !== undefined && value !== null,
      `Value for ${this.constructor.name} must be defined`,
    );
    this.#data[entityId] = value;
  }

  remove(entityId: number) {
    delete this.#data[entityId];
  }
}

export class PrimativeArrayComponent<Item> extends ArrayComponentBase<Item> {
  constructor(data: Item[]) {
    super(data);
  }

  serialize(entityId: number) {
    return this.get(entityId);
  }

  deserialize(entityId: number, data: Item) {
    this.addSet(entityId, data);
  }
}

export class TagComponent extends PrimativeArrayComponent<boolean> {
  constructor() {
    super([]);
  }
  get(entityId: number): boolean {
    return super.has(entityId);
  }
  addSet(_entityId: number, value?: boolean) {
    invariant(
      value !== false,
      "A TagComponent can only be set to true. Perhaps you meant to remove it?",
    );
    super.addSet(_entityId, true);
  }
}

export class ComponentRegistry {
  #entries = {} as Record<string, ComponentBase<any, any>>;
  #onAdd: (
    Component: ComponentConstructor<any>,
    entityId: number,
    value: any,
  ) => void;
  #onRemove: (Component: ComponentConstructor<any>, entityId: number) => void;
  constructor(
    onAdd = (
      _Component: ComponentConstructor<any>,
      _entityId: number,
      _value: any,
    ) => {},
    onRemove = (_Component: ComponentConstructor<any>, _entityId: number) => {},
  ) {
    this.#onAdd = onAdd;
    this.#onRemove = onRemove;
  }
  register(component: ComponentBase<any, any>) {
    this.#entries[component.serialType] = component;
    component.onAddSet = (id, value) => {
      this.#onAdd(
        component.constructor as ComponentConstructor<any>,
        id,
        value,
      );
    };
    component.onRemove = (id) => {
      this.#onRemove(component.constructor as ComponentConstructor<any>, id);
    };
  }
  get(klass: ComponentConstructor<any, any>) {
    return this.#entries[klass.name];
  }
  [Symbol.iterator]() {
    return Object.values(this.#entries)[Symbol.iterator]();
  }
}

import { invariant } from "./Error";

export type ComponentConstructor<
  Item,
  Collection,
  SerializedItem = Item,
> = new (...args: any[]) => ComponentBase<Item, Collection, SerializedItem>;

export abstract class ComponentBase<
  Item,
  Collection = Item[],
  SerializedItem = Item,
> {
  #derivedAddSet: (entityId: number, value: Item) => void;
  #derivedRemove: (entityId: number) => void;
  #derivedGet: (entityId: number, defaultValue?: Item) => Item;
  constructor(_data: Collection) {
    this.#derivedAddSet = this.addSet;
    this.#derivedRemove = this.remove;
    this.#derivedGet = this.get;

    this.addSet = (entityId: number, value: Item) => {
      this.#derivedAddSet(entityId, value);
      this.onAddSet(entityId, value);
    };

    this.remove = (entityId: number) => {
      this.#derivedRemove(entityId);
      this.onRemove(entityId);
    };

    this.get = (entityId: number, defaultValue?: Item) => {
      invariant(
        this.isSaneGet(entityId, defaultValue),
        `Entity ${entityId} has no ${this.constructor.name}`,
      );
      return this.#derivedGet(entityId, defaultValue);
    };
  }

  onAddSet = (_entityId: number, _value: Item) => {};
  onRemove = (_entityId: number) => {};

  isSaneGet(entityId: number, defaultValue?: Item): boolean {
    return defaultValue !== undefined || this.has(entityId);
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

import { invariant } from "./Error";

export abstract class ComponentBase<
  Name extends String,
  Item,
  Collection,
  SerializedItem = Item,
> {
  constructor(
    readonly name: Name,
    _data: Collection,
  ) {}

  isSaneGet(entityId: number, defaultValue?: Item): boolean {
    return defaultValue !== undefined || this.has(entityId);
  }

  abstract has(entityId: number): boolean;
  abstract get(entityId: number, defaultValue?: Item): Item;
  abstract addSet(entityId: number, value: Item): void;
  abstract remove(entityId: number): void;
  abstract serialize(entityId: number): SerializedItem;
  abstract deserialize(
    entityId: number,
    value: SerializedItem,
  ): void | Promise<void>;
}

export abstract class ArrayComponentBase<
  Name extends String,
  Item,
  SerializedItem = Item,
> extends ComponentBase<Name, Item, Item[], SerializedItem> {
  #data: Item[];

  constructor(name: Name, data: Item[]) {
    super(name, data);
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
    invariant(
      this.isSaneGet(entityId, defaultValue),
      `Entity ${entityId} has no ${this.name} component`,
    );
    return this.#data[entityId] ?? defaultValue!;
  }

  addSet(entityId: number, value: Item) {
    invariant(
      value !== undefined && value !== null,
      `Value for ${this.name} component must be defined`,
    );
    this.#data[entityId] = value;
  }

  remove(entityId: number) {
    delete this.#data[entityId];
  }
}

export class PrimativeArrayComponent<
  Name extends string,
  Item,
> extends ArrayComponentBase<Name, Item> {
  constructor(name: Name, data: Item[]) {
    super(name, data);
  }

  serialize(entityId: number) {
    return this.get(entityId);
  }

  deserialize(entityId: number, data: Item) {
    this.addSet(entityId, data);
  }
}

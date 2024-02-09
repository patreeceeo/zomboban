import { invariant } from "./Error";

type EntityCallback = (id: number) => void;

export class EntityStore {
  #added = new Set<number>();
  #removed = new Set<number>();
  #usedArray: boolean[] = [];

  constructor() {}

  #nextId(): number {
    for (let i = 0; i < this.#usedArray.length; i++) {
      if (!(i in this.#usedArray)) {
        return i;
      }
    }
    return this.#usedArray.length;
  }

  /** The set of entities that have been added. */
  get added(): Enumerable<number> {
    return this.#added;
  }

  /** The set of entities that have been added and then removed. */
  get removed(): Enumerable<number> {
    return this.#removed;
  }

  /** Add an entity to the game/simulation/whatever. */
  add(
    factory?: EntityCallback,
    id = this.#nextId(),
    errorIfAlreadyAdded = true,
  ): number {
    invariant(
      !errorIfAlreadyAdded || !this.#added.has(id),
      `Entity ${id} has already been added.`,
    );
    this.#added.add(id);
    if (this.#removed.has(id)) {
      this.#removed.delete(id);
    }
    this.#usedArray[id] = true;
    factory?.(id);
    return id;
  }

  has(id: number): boolean {
    // return this.#used.has(id);
    return id in this.#usedArray;
  }

  set(id: number): void {
    if (!this.has(id)) {
      this.add(undefined, id, false);
    }
  }

  /** Remove an entity. */
  remove(id: number): void {
    if (this.#added.delete(id)) {
      this.#removed.add(id);
    }
  }

  /** Recycle a removed entities such that it can be added again. */
  recycle(id: number): void {
    if (this.#removed.delete(id)) {
      delete this.#usedArray[id];
    }
  }

  isSane(): boolean {
    for (const id of this.#added) {
      if (this.#removed.has(id)) {
        return false;
      }
      if (!this.has(id)) {
        return false;
      }
    }
    for (const id of this.#removed) {
      if (this.#added.has(id)) {
        return false;
      }
      if (!this.has(id)) {
        return false;
      }
    }
    return true;
  }
}

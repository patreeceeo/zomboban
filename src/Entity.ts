import { invariant } from "./Error";

type EntityCallback = (id: number) => void;

export class EntityStore {
  #set = new Set<number>();
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

  /** Add an entity to the game/simulation/whatever. */
  add(
    factory?: EntityCallback,
    id = this.#nextId(),
    errorIfAlreadyAdded = true,
  ): number {
    invariant(
      !errorIfAlreadyAdded || !this.has(id),
      `Entity ${id} has already been added.`,
    );
    this.#set.add(id);
    this.#usedArray[id] = true;
    factory?.(id);
    return id;
  }

  has(id: number): boolean {
    return id in this.#usedArray;
  }

  /** Recycle a removed entities such that it can be added again. */
  recycle(id: number): void {
    this.#set.delete(id);
    delete this.#usedArray[id];
  }

  isSane(): boolean {
    for (const id of this.#set) {
      if (!this.has(id)) {
        return false;
      }
    }
    return true;
  }

  values(): Enumerable<number> {
    return this.#set;
  }

  reset(): void {
    this.#set.clear();
    this.#usedArray.length = 0;
  }
}

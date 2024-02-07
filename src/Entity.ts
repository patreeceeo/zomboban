import { invariant } from "./Error";
import { SpanSet } from "./SpanSet";

type EntityCallback = (id: number) => void;

export class EntityStore {
  #added = new Set<number>();
  #removed = new Set<number>();
  #used = new SpanSet();

  #nextId(): number {
    return this.#used.nextAvailableIndex;
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
    this.#removed.delete(id);
    this.#used.add(id);
    factory?.(id);
    return id;
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
      this.#used.delete(id);
    }
  }

  isSane(): boolean {
    for (const id of this.#added) {
      if (this.#removed.has(id)) {
        return false;
      }
      if (!this.#used.includes(id)) {
        return false;
      }
    }
    for (const id of this.#removed) {
      if (this.#added.has(id)) {
        return false;
      }
      if (!this.#used.includes(id)) {
        return false;
      }
    }
    return true;
  }
}

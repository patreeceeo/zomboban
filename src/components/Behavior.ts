import { ArrayComponentBase } from "../Component";
import { ActLike } from "./ActLike";

// export abstract class Behavior implements Behavior {
//   static fromCombination(...behaviors: Behavior[]): Behavior
//   isCombinedBehavior(...behaviors: Behavior[]): boolean
// }

export interface Behavior {
  readonly type: ActLike;
  // TODO what if behaviors were actually stateless? then there wouldn't need to be any special handling for serialization and deserialization, and a BehaviorId component could replace the need for an enum
  // would need to also have a component for whether a behavior is started or not. The behavior itself would more or less be the onFrame function.
  readonly entityId: number;
  /** Shall be called after all other components have been added */
  start(): void;
  isStarted: boolean;
  stop(): void;
  serialize(): string;
  onFrame(deltaTime: number, elapsedTime: number): void;
}

export type SerializedBehavior = string;

export type BehaviorConstructor = new (
  entityId: number,
  ...args: any[]
) => Behavior;

export class BehaviorComponent extends ArrayComponentBase<
  Behavior | string,
  string
> {
  #types: Record<string, new (id: number) => Behavior> = {};
  constructor() {
    super([]);
  }
  registerType = (behaviorType: BehaviorConstructor) => {
    this.#types[behaviorType.name] = behaviorType;
  };
  serialize = (entityId: number) => {
    const value = this.get(entityId);
    if (typeof value === "string") {
      return value;
    } else {
      return value.serialize();
    }
  };
  deserialize = (entityId: number, serializedValue: SerializedBehavior) => {
    if (serializedValue in this.#types) {
      const BehaviorType = this.#types[serializedValue];
      this.addSet(entityId, new BehaviorType(entityId));
    } else {
      this.addSet(entityId, serializedValue);
      console.warn(`Behavior type ${serializedValue} not registered`);
    }
  };
}

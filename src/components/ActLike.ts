import {
  ComponentDeserializer,
  ComponentSerializer,
  defineComponent,
} from "../Component";
import { invariant } from "../Error";

export interface Behavior {
  readonly type: ActLike;
  readonly entityId: number;
  /** Shall be called after all other components have been added */
  start(): void;
  isStarted: boolean;
  stop(): void;
  toString(): string;
  onFrame(deltaTime: number, elapsedTime: number): void;
}

// TODO: do away with this enum?
export enum ActLike {
  NONE = 0,
  PLAYER = 1,
  BOX = 1 << 1,
  WALL = 1 << 2,
  BRO = 1 << 3,
  AIRPLANE = 1 << 4,
  GAME_OBJECT = ActLike.PLAYER |
    ActLike.BOX |
    ActLike.WALL |
    ActLike.BRO |
    ActLike.AIRPLANE,
  PUSHER = ActLike.PLAYER | ActLike.BRO,
  ENEMY = ActLike.BRO,
  CURSOR = 1 << 40,
}

const serializeActLike: ComponentSerializer<Behavior, ActLike> = (data) => {
  return data.map((behavior) => {
    if (behavior) {
      return behavior.type;
    }
  });
};

const deserializeActLike: ComponentDeserializer<ActLike, Behavior> = async (
  data,
  startIndex = 0,
) => {
  const BEHAVIOR_MAP = await getBehaviorMap();
  return data.map((value, entityId) => {
    if (value) {
      const Constructor = BEHAVIOR_MAP[value as ActLike];
      invariant(!!Constructor, `Cannot deserialize behavior ${value}`);
      return new Constructor!(entityId + startIndex);
    }
  }) as Behavior[];
};

const DATA = defineComponent(
  "ActLike",
  [],
  hasActLike,
  getActLike,
  setActLike,
  removeActLike,
  serializeActLike,
  deserializeActLike,
);

export function setActLike(entityId: number, value: Behavior) {
  invariant("onFrame" in value, "This doesn't look like a behavior");
  if (hasActLike(entityId)) {
    removeActLike(entityId);
  }
  DATA[entityId] = value;
}

export function removeActLike(entityId: number) {
  const behavior = getActLike(entityId);
  behavior.stop();
  delete DATA[entityId];
}

export function isActLike(entityId: number, value: ActLike | number): boolean {
  return (DATA[entityId]?.type & value) !== 0;
}

export function hasActLike(entityId: number): boolean {
  return !!DATA[entityId];
}

export function getActLike(entityId: number): Behavior {
  invariant(hasActLike(entityId), `Entity ${entityId} has no ActLike`);
  return DATA[entityId];
}

async function getBehaviorMap(): Promise<
  Partial<Record<ActLike, new (entityId: number) => Behavior>>
> {
  const {
    WallBehavior,
    BroBehavior,
    PlayerBehavior,
    BoxBehavior,
    CursorBehavior,
  } = await import("../behaviors");
  return {
    [ActLike.WALL]: WallBehavior,
    [ActLike.BRO]: BroBehavior,
    [ActLike.PLAYER]: PlayerBehavior,
    [ActLike.BOX]: BoxBehavior,
    [ActLike.CURSOR]: CursorBehavior,
  };
}

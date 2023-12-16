export enum Key {
  a = 1 << 0,
  b = 1 << 1,
  c = 1 << 2,
  d = 1 << 3,
  e = 1 << 4,
  f = 1 << 5,
  g = 1 << 6,
  h = 1 << 7,
  i = 1 << 8,
  j = 1 << 9,
  k = 1 << 10,
  l = 1 << 11,
  m = 1 << 12,
  n = 1 << 13,
  o = 1 << 14,
  p = 1 << 15,
  q = 1 << 16,
  r = 1 << 17,
  s = 1 << 18,
  t = 1 << 19,
  u = 1 << 20,
  v = 1 << 21,
  w = 1 << 22,
  x = 1 << 23,
  y = 1 << 24,
  z = 1 << 25,
  Space = 1 << 26,
  Escape = 1 << 27,
  Shift = 1 << 28,
}

declare const OPAQUE_TYPE: unique symbol;

export type KeyCombo = number & {
  readonly [OPAQUE_TYPE]: "Key";
};

export type KeyMap<Value> = Partial<Record<Key, Value>>;

let KEYS_DOWN = 0 as KeyCombo;
let KEYS_REPEATING = 0 as KeyCombo;
let lastKeyDown: Key | undefined;

export function combineKeys(combo: KeyCombo, newKey: Key): KeyCombo {
  return (combo | newKey) as KeyCombo;
}
export function removeKey(combo: KeyCombo, key: Key): KeyCombo {
  return (combo & ~key) as KeyCombo;
}
export function includesKey(combo: KeyCombo, key: Key): boolean {
  return (combo & key) === key;
}

function parseEventKey(e: KeyboardEvent): Key | undefined {
  const keyStr = e.key;
  switch (keyStr) {
    case "Shift":
      return Key.Shift;
    case "Escape":
      return Key.Escape;
    case " ":
      return Key.Space;
    default: {
      return Key[keyStr.toLowerCase() as keyof typeof Key];
    }
  }
}

export function handleKeyDown(e: KeyboardEvent) {
  const key = parseEventKey(e);
  if (key === undefined) {
    return;
  }
  KEYS_DOWN = combineKeys(KEYS_DOWN, key);
  if (e.repeat) {
    KEYS_REPEATING = combineKeys(KEYS_REPEATING, key);
  }
  for (const queue of INPUT_QUEUES) {
    queue.push(KEYS_DOWN);
  }
  lastKeyDown = key;
}
export function handleKeyUp(e: KeyboardEvent) {
  const key = parseEventKey(e);
  if (key === undefined) {
    return;
  }
  KEYS_DOWN = removeKey(KEYS_DOWN, key);
  KEYS_REPEATING = removeKey(KEYS_REPEATING, key);
}
export function isKeyDown(key: Key | KeyCombo): boolean {
  return includesKey(KEYS_DOWN, key);
}
export function isAnyKeyDown(keys: Array<Key | KeyCombo>): boolean {
  for (const key of keys) {
    if (isKeyDown(key)) {
      return true;
    }
  }
  return false;
}
/** @deprecated */
export function getLastKeyDown(): Key | undefined {
  return lastKeyDown;
}
export function isKeyRepeating(key: Key | KeyCombo): boolean {
  return includesKey(KEYS_REPEATING, key);
}

const INPUT_QUEUES: Set<KeyCombo[]> = new Set();
export function createInputQueue(): KeyCombo[] {
  const queue: KeyCombo[] = [];
  INPUT_QUEUES.add(queue);
  return queue;
}

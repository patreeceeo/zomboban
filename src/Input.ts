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
  Shift = 1 << 28
}

declare const OPAQUE_TYPE: unique symbol;

export type KeyCombo = number & {
  readonly [OPAQUE_TYPE]: "Key";
};

export type KeyMap<Value> = Record<Key, Value>;

export function combineKeys(combo: KeyCombo, newKey: Key): KeyCombo {
  return (combo | newKey) as KeyCombo;
}
export function removeKey(combo: KeyCombo, key: Key): KeyCombo {
  return (combo & ~key) as KeyCombo;
}
export function includesKey(input: KeyCombo, key: Key): boolean {
  return (input & key) === key;
}

export function parseEventKey(e: KeyboardEvent): Key | undefined {
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

export function createInputQueue(): KeyCombo[] {
  return [];
}

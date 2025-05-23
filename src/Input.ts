export enum Key {
  a = 1 << 0,
  b = 1 << 1,
  d = 1 << 2,
  f = 1 << 3,
  h = 1 << 4,
  i = 1 << 5,
  j = 1 << 6,
  k = 1 << 7,
  l = 1 << 8,
  m = 1 << 9,
  p = 1 << 10,
  r = 1 << 11,
  s = 1 << 12,
  t = 1 << 13,
  u = 1 << 14,
  w = 1 << 15,
  x = 1 << 16,
  y = 1 << 17,
  z = 1 << 18,
  e = 1 << 19,
  g = 1 << 20,
  Control = 1 << 21,
  Enter = 1 << 22,
  Space = 1 << 23,
  Escape = 1 << 24,
  Shift = 1 << 25,
  Pointer1 = 1 << 26,
  ArrowDown = 1 << 28,
  ArrowUp = 1 << 29,
  ArrowLeft = 1 << 30,
  ArrowRight = 1 << 31
}

declare const OPAQUE_TYPE: unique symbol;

export type KeyCombo = number & {
  readonly [OPAQUE_TYPE]: "Key";
};

export type KeyMap<Value> = Record<Key, Value>;

export function combineKeys(...keys: (Key | KeyCombo)[]): KeyCombo {
  let result = 0;
  for (const key of keys) {
    result |= key;
  }
  return result as KeyCombo;
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
    case "Enter":
      return Key.Enter;
    case "Control":
      return Key.Control;
    case " ":
      return Key.Space;
    default: {
      return (
        Key[keyStr as keyof typeof Key] ??
        Key[keyStr.toLowerCase() as keyof typeof Key]
      );
    }
  }
}

export function createInputQueue(): KeyCombo[] {
  return [];
}

export function keyComboToString(combo: KeyCombo) {
  const results = [];
  for (const [name, value] of Object.entries(Key)) {
    if (typeof value === "number" && includesKey(combo, value)) {
      results.push(name);
    }
  }
  return results.join("+");
}

export const enum Key {
  a = "a",
  b = "b",
  c = "c",
  d = "d",
  e = "e",
  f = "f",
  g = "g",
  h = "h",
  i = "i",
  j = "j",
  k = "k",
  l = "l",
  m = "m",
  n = "n",
  o = "o",
  p = "p",
  q = "q",
  r = "r",
  s = "s",
  t = "t",
  u = "u",
  v = "v",
  w = "w",
  x = "x",
  y = "y",
  z = "z",
  Space = " ",
  Escape = "escape",
  Shift = "shift",
}

export type KeyMap<Value> = Partial<Record<Key, Value>>;

const KEYS_DOWN: KeyMap<boolean> = {};
const KEYS_REPEATING: KeyMap<boolean> = {};
let lastKeyDown: Key | undefined;

export function handleKeyDown(e: KeyboardEvent) {
  const key = e.key.toLowerCase() as Key;
  KEYS_DOWN[key] = true;
  if (e.repeat) {
    KEYS_REPEATING[key] = true;
  }
  lastKeyDown = key;
}
export function handleKeyUp(e: KeyboardEvent) {
  const key = e.key.toLowerCase() as Key;
  KEYS_DOWN[key] = false;
  KEYS_REPEATING[key] = false;
}
export function isKeyDown(key: Key): boolean {
  return !!KEYS_DOWN[key];
}
export function isAnyKeyDown(keys: Array<Key>): boolean {
  for (const key of keys) {
    if (isKeyDown(key)) {
      return true;
    }
  }
  return false;
}
export function getLastKeyDown(): Key | undefined {
  return lastKeyDown;
}
export function isKeyRepeating(key: Key): boolean {
  return !!KEYS_REPEATING[key];
}

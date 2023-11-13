export const enum Key {
  a = "a",
  s = "s",
  d = "d",
  h = "h",
  j = "j",
  k = "k",
  l = "l",
  r = "r",
  w = "w",
  W = "W",
  p = "p",
  c = "c",
  z = "z",
  x = "x",
  Space = " ",
  Escape = "Escape",
}

export type KeyMap<Value> = Partial<Record<Key, Value>>;

const KEYS_DOWN: KeyMap<boolean> = {};
const KEYS_REPEATING: KeyMap<boolean> = {};
let lastKeyDown: Key | undefined;

export function handleKeyDown(e: KeyboardEvent) {
  const key = e.key as Key;
  KEYS_DOWN[key] = true;
  if (e.repeat) {
    KEYS_REPEATING[key] = true;
  }
  lastKeyDown = key;
}
export function handleKeyUp(e: KeyboardEvent) {
  const key = e.key as Key;
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

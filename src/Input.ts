

const KEYS_DOWN: { [key: string]: boolean } = {}
const KEYS_REPEATING: { [key: string]: boolean } = {}
let lastKeyDown: string | undefined;

export function handleKeyDown(e: KeyboardEvent) {
  KEYS_DOWN[e.code] = true;
  if(e.repeat) {
    KEYS_REPEATING[e.code] = true;
  }
  lastKeyDown = e.code;
}
export function handleKeyUp(e: KeyboardEvent) {
  KEYS_DOWN[e.code] = false;
  KEYS_REPEATING[e.code] = false;
}
export function isKeyDown(key: string): boolean {
  return KEYS_DOWN[key];
}
export function getLastKeyDown(): string | undefined {
  return lastKeyDown;
}
export function isKeyRepeating(key: string): boolean {
  return KEYS_REPEATING[key];
}

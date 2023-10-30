

const KEY_STATES: { [key: string]: boolean } = {}

export function handleKeyDown(e: KeyboardEvent) {
  KEY_STATES[e.code] = true;
}
export function handleKeyUp(e: KeyboardEvent) {
  KEY_STATES[e.code] = false;
}
export function isKeyDown(key: string): boolean {
  return KEY_STATES[key];
}

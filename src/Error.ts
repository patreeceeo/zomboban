export function raise(message: string): never {
  throw new Error(message);
}

export function invariant(
  condition: boolean,
  message: string
): asserts condition {
  if (!condition) {
    raise(message);
  }
}

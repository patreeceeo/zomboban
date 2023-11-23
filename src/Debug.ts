export function getStackTrace() {
  const stack = new Error().stack;
  return stack !== undefined
    ? `\n${stack.split("\n").slice(2).join("\n")}`
    : "(No stack trace)";
}

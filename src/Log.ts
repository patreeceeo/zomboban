const logState = {
  content: "",
};

export function writeLog(content: string) {
  logState.content = content + "\n" + logState.content;
}

export function readLog() {
  return logState.content;
}

export function clearLog() {
  logState.content = "";
}

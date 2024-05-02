import { System } from "../System";
import { LogState } from "../state";

class LogLine {
  constructor(
    readonly time: number,
    readonly subject: string,
    readonly message: string
  ) {}
}

export class Log {
  lines: LogLine[] = [];
  constructor(readonly subject: string) {}
  writeLn(...message: any[]) {
    this.lines.push(
      new LogLine(performance.now(), this.subject, message.join(" "))
    );
  }
  clear() {
    this.lines.length = 0;
  }
}

export class LogBundle {
  #logs: Log[] = [];
  constructor() {}
  addLog(log: Log) {
    this.#logs.push(log);
  }
  clear() {
    for (const log of this.#logs) {
      log.clear();
    }
  }
  getText() {
    // sort lines by time
    const lines = this.#logs
      .flatMap((log) => log.lines)
      .sort((a, b) => a.time - b.time);
    let text = "";
    for (const line of lines) {
      text += `${Math.round(line.time)} ${line.subject}: ${line.message}\n`;
    }
    return text;
  }
}

declare const debug: HTMLElement;
export class LogSystem extends System<LogState> {
  update(state: LogState) {
    debug.innerHTML = state.logs.getText();
    state.logs.clear();
  }
}

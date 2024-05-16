import { Observable } from "../Observable";
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
  enabled = false;
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
  #logs: Record<string, Log> = {};
  #addObserver = new Observable<Log>();
  constructor() {}
  addLog(log: Log) {
    this.#logs[log.subject] = log;
    this.#addObserver.next(log);
  }
  getLog(subject: string) {
    return this.#logs[subject];
  }
  get subjects() {
    return Object.keys(this.#logs);
  }
  clear() {
    for (const log of Object.values(this.#logs)) {
      log.clear();
    }
  }
  clearStale(maxAge: number) {
    const now = performance.now();
    for (const log of Object.values(this.#logs)) {
      log.lines = log.lines.filter((line) => now - line.time < maxAge);
    }
  }
  /** get lines from the enabled logs in chronological order */
  getText() {
    const lines = [];
    for (const log of Object.values(this.#logs)) {
      if (log.enabled) {
        lines.push(...log.lines);
      }
    }
    lines.sort((a, b) => a.time - b.time);
    return lines
      .map(
        (line) =>
          `${line.subject} ${Math.round(line.time).toString(16)}: ${line.message}`
      )
      .join("\n");
  }
  forEach(observer: (log: Log) => void) {
    for (const log of Object.values(this.#logs)) {
      observer(log);
    }
    return this.#addObserver.subscribe(observer);
  }
}

declare const logElement: HTMLElement;
declare const logOptionsForm: HTMLElement;
declare const logLineMaxAgeInput: HTMLInputElement;

const logsSubjects = new Set<string>();
export class LogSystem extends System<LogState> {
  start(state: LogState) {
    state.logs.forEach((log) => {
      if (!logsSubjects.has(log.subject)) {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = log.enabled;
        checkbox.onchange = () => {
          state.logs.getLog(log.subject).enabled = checkbox.checked;
        };
        const label = document.createElement("label");
        label.textContent = log.subject;
        label.prepend(checkbox);
        logOptionsForm.appendChild(label);
        logsSubjects.add(log.subject);
      }
    });
  }
  update(state: LogState) {
    logElement.innerHTML = state.logs.getText();
    const maxAge = parseInt(logLineMaxAgeInput.value, 10);
    if (maxAge > 0) {
      state.logs.clearStale(maxAge);
    } else {
      state.logs.clear();
    }
  }
}

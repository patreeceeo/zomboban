/**
 * Requirements:
 *
 * Need to be able to filter by subjects, severity, (time?)
 *
 * Eventually need to be able to define how the log messages are stored and presented.
 * For now, simply using the Console API will be fine.
 *
 * Out of scope: Stringification. Log messages should be strictly of type "string".
 */

import { Observable } from "./Observable";

export class Log {
  constructor(readonly adaptor: LogAdaptor) {}
  #subscriptions = [] as IResourceHandle[];
  #subjects = [] as LogSubject[];
  get subjects(): readonly LogSubject[] {
    return this.#subjects;
  }
  addSubject(subject: LogSubject) {
    this.#subjects.push(subject);
    this.#subscriptions.push(
      subject.onAppend((message) => {
        this.adaptor.append(subject, message);
      })
    );
  }
}

export enum LogLevel {
  Info,
  Normal,
  Warning,
  Error
}

class LogEntry {
  constructor(
    readonly level: LogLevel,
    readonly message: string
  ) {}
}

export abstract class LogAdaptor {
  abstract append(subject: LogSubject, entry: LogEntry): void;
}

export class ConsoleAdaptor extends LogAdaptor {
  #fns = {
    [LogLevel.Info]: console.info.bind(console),
    [LogLevel.Normal]: console.log.bind(console),
    [LogLevel.Warning]: console.warn.bind(console),
    [LogLevel.Error]: console.error.bind(console)
  };
  append(subject: LogSubject, entry: LogEntry) {
    this.#fns[entry.level](`[${subject.name}]: ${entry.message}`);
  }
}

export class LogSubject {
  constructor(readonly name: string) {}
  #observable = new Observable<LogEntry>();
  append(message: string, level = LogLevel.Normal) {
    const entry = new LogEntry(level, message);
    this.#observable.next(entry);
  }
  onAppend(cb: (message: LogEntry) => void) {
    return this.#observable.subscribe(cb);
  }
}

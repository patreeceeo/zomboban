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
import { getEmptyArray } from "./functions/Array";
import { updateMapKey } from "./functions/Map";
import { createSet, getIntersectionSet, getUnionSet } from "./functions/Set";

export class Log {
  constructor() {}
  #adaptors = [] as LogAdaptor[];
  #subscriptions = [] as IResourceHandle[];
  #subjectsByIdentity = new Map<any, LogSubject>();
  addAdaptor(adaptor: LogAdaptor) {
    this.#adaptors.push(adaptor);
  }
  get subjects(): Iterable<LogSubject> {
    return this.#subjectsByIdentity.values();
  }
  addSubject(subject: LogSubject) {
    // TODO test for duplicates according to the equals method
    this.#subjectsByIdentity.set(subject.identity(), subject);
    this.#subscriptions.push(
      subject.onAppend((message) => {
        for (const adaptor of this.#adaptors) {
          adaptor.append(subject, message);
        }
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

export class LogEntry {
  constructor(
    readonly level: LogLevel,
    readonly time: number,
    readonly message: string
  ) {}

  toString() {
    return `${LogLevel[this.level]}@${Math.round(this.time)} "${this.message}`;
  }
}

export abstract class LogAdaptor {
  abstract append(subject: LogSubject, entry: LogEntry): void;
}

export class LogToConsoleAdaptor extends LogAdaptor {
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

interface ILogToMemoryFilter {
  levels?: LogLevel[];
  subjects?: LogSubject[];
}

export class LogToMemoryAdaptor extends LogAdaptor {
  maxEntries = 1_000_000;
  #entries = [] as LogEntry[];
  #subjectIndexes = new Map<any, Set<number>>();
  #levelIndexes = new Map<LogLevel, Set<number>>();
  append(subject: LogSubject, entry: LogEntry): void {
    updateMapKey(
      this.#levelIndexes,
      entry.level,
      this.#updateIndexes,
      createSet
    );
    updateMapKey(
      this.#subjectIndexes,
      subject.data ?? subject,
      this.#updateIndexes,
      createSet
    );
    this.#entries.push(entry);
  }

  #updateIndexes = (indexes: Set<number>) => {
    const index = this.#entries.length;
    indexes.add(index);
    return indexes;
  };

  getSubjectIndexes(subject: LogSubject): Set<number> | undefined {
    return this.#subjectIndexes.get(subject.data ?? subject);
  }

  getLevelIndexes(level: LogLevel): Set<number> | undefined {
    return this.#levelIndexes.get(level);
  }

  filter(filter: ILogToMemoryFilter, target = [] as LogEntry[]) {
    const indexSetsForLevels = [] as Set<any>[];
    for (const level of filter.levels ?? getEmptyArray()) {
      const indexSet = this.getLevelIndexes(level);
      if (indexSet !== undefined) {
        indexSetsForLevels.push(indexSet);
      }
    }

    const indexSetsForSubjects = [] as Set<any>[];
    for (const subject of filter.subjects ?? getEmptyArray()) {
      const indexSet = this.getSubjectIndexes(subject);
      if (indexSet !== undefined) {
        indexSetsForSubjects.push(indexSet);
      }
    }

    const indexes =
      filter.levels !== undefined && filter.subjects !== undefined
        ? getIntersectionSet([
            getUnionSet(indexSetsForLevels),
            getUnionSet(indexSetsForSubjects)
          ])
        : filter.levels !== undefined
          ? getUnionSet(indexSetsForLevels)
          : filter.subjects !== undefined
            ? getUnionSet(indexSetsForSubjects)
            : [];

    for (const index of indexes) {
      const entry = this.#entries[index];
      // TODO(perf): could optimize by inserting in order?
      target.push(entry);
    }

    target.sort((a, b) => a.time - b.time);

    return target;
  }
}

export class LogSubject {
  constructor(
    readonly name: string,
    readonly data: any = undefined
  ) {}
  #observable = new Observable<LogEntry>();
  append(message: string, level = LogLevel.Normal) {
    const entry = new LogEntry(level, performance.now(), message);
    this.#observable.next(entry);
  }
  onAppend(cb: (message: LogEntry) => void) {
    return this.#observable.subscribe(cb);
  }
  equals(other: LogSubject): boolean {
    return this.identity() === other.identity();
  }
  identity() {
    return this.data ?? this;
  }
}

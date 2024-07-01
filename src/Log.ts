/**
 * Requirements:
 *
 * Need to be able to filter by subjects, severity, time.
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
  addSubject(subject: LogSubject) {
    this.#subscriptions.push(
      subject.onAppend((message) => {
        this.adaptor.append(subject, message);
      })
    );
  }
}

export abstract class LogAdaptor {
  abstract append(subject: LogSubject, message: string): void;
}

export class LogSubject {
  constructor(readonly name: string) {}
  #observable = new Observable<string>();
  append(message: string) {
    this.#observable.next(message);
  }
  onAppend(cb: (message: string) => void) {
    return this.#observable.subscribe(cb);
  }
}

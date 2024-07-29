import { URLSearchParams, location } from "./globals";
export class Route {
  static registery = {} as Record<string, Route>;

  static getOrCreate(id: string) {
    const { registery } = this;
    if (!(id in registery)) {
      return (registery[id] = new Route(id));
    } else {
      const result = registery[id];
      result.clearParams();
      return result;
    }
  }

  static fromLocation({ hash } = location) {
    if (hash.length > 0 && hash !== "#") {
      const result = this.getOrCreate(hash.slice(1));

      const query = new URLSearchParams(location.search);

      for (const [key, value] of query) {
        result.setParam(key, value);
      }
      return result;
    }
  }

  #params = new URLSearchParams();

  constructor(readonly id: string) {}

  clearParams() {
    for (const key of this.#params.keys()) {
      this.#params.delete(key);
    }
  }

  // TODO get rid of this and make it a readonly private property
  setParam(name: string, value: string) {
    this.#params.set(name, value);
  }

  follow() {
    location.href = `${location.protocol}//${location.host}${location.pathname}${
      this.#params.size > 0 ? "?" + this.#params.toString() : ""
    }#${this.id}`;
  }
}

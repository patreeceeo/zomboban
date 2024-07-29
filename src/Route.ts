import { URLSearchParams, location } from "./globals";
export class Route {
  static registery = {} as Record<string, Route>;

  static emptyParams = new URLSearchParams();

  static getOrCreate(id: string, params = this.emptyParams) {
    const { registery } = this;
    if (!(id in registery)) {
      return (registery[id] = new Route(id, params));
    } else {
      const result = registery[id];
      return result;
    }
  }

  static fromLocation({ hash } = location) {
    if (hash.length > 0 && hash !== "#") {
      return this.getOrCreate(hash.slice(1));
    }
  }

  #params: URLSearchParams;

  constructor(
    readonly id: string,
    params = Route.emptyParams
  ) {
    this.#params = params;
  }

  follow() {
    location.href = `${location.protocol}//${location.host}${location.pathname}${
      this.#params.size > 0 ? "?" + this.#params.toString() : ""
    }#${this.id}`;
  }
}

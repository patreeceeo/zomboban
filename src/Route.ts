import { URLSearchParams, location } from "./globals";
export class Route {
  static registery = {} as Record<string, Route>;

  static emptyParams = new URLSearchParams();

  static stringify(path: string, params: URLSearchParams) {
    return `${params.size > 0 ? "?" + params.toString() : ""}#${path}`;
  }

  static getOrCreate(path: string, params = this.emptyParams) {
    const { registery } = this;
    const id = this.stringify(path, params);
    if (!(id in registery)) {
      return (registery[id] = new Route(path, params));
    } else {
      return registery[id];
    }
  }

  static fromLocation({ hash } = location) {
    if (hash.length > 0 && hash !== "#") {
      return this.getOrCreate(hash.slice(1));
    }
  }

  #params: URLSearchParams;

  constructor(
    readonly path: string,
    params = Route.emptyParams
  ) {
    this.#params = params;
  }

  toHref() {
    return `${location.protocol}//${location.host}${location.pathname}${Route.stringify(this.path, this.#params)}`;
  }

  follow() {
    location.href = this.toHref();
  }
}

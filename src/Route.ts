import { location } from "./globals";
import { SystemEnum } from "./systems";
import { joinPath } from "./util";

/** Immutable */
export class RouteId {
  static stringify(hash: string, params: string) {
    return `${params.length > 0 ? "?" + params : ""}#${hash}`;
  }

  static readonly root = new RouteId("");

  static fromLocation({ pathname, hash, search } = location) {
    return new RouteId(
      pathname,
      hash.length > 0 ? hash.slice(1) : "",
      search.length > 0 ? search.slice(1) : ""
    );
  }

  constructor(
    readonly path: string,
    readonly hash = "",
    readonly params = ""
  ) {}

  toHref() {
    return `${location.protocol}//${location.host}${location.pathname}${RouteId.stringify(this.hash, this.params)}`;
  }

  follow(_loc = location) {
    _loc.href = this.toHref();
  }

  #testHashOrSearch(mine: string, fromLocation: string) {
    return (
      (fromLocation.length === 0 && mine.length === 0) ||
      (fromLocation.endsWith(mine) && fromLocation.length === mine.length + 1)
    );
  }

  test(_loc = location) {
    return (
      this.path === _loc.pathname &&
      this.#testHashOrSearch(this.hash, _loc.hash) &&
      this.#testHashOrSearch(this.params, _loc.search)
    );
  }

  equals(other: RouteId) {
    return (
      this.hash === other.hash &&
      this.path === other.path &&
      this.params === other.params
    );
  }

  clone() {
    return new RouteId(this.path, this.hash, this.params);
  }

  nest(name: string) {
    return new RouteId(joinPath(this.path, name), this.hash, this.params);
  }
}

export class RouteSystemRegistery {
  #data = {} as Record<string, Set<SystemEnum>>;

  register(routeId: RouteId, systems = [] as SystemEnum[]) {
    this.#data[routeId.hash] = new Set(systems);
    return this;
  }

  #emptySet = new Set();
  getSystems(routeId: RouteId) {
    return this.#data[routeId.hash] ?? this.#emptySet;
  }

  has(routeId: RouteId) {
    return routeId.hash in this.#data;
  }
}

import { location } from "./globals";
import { SystemEnum } from "./systems";
import { joinPath } from "./util";

/** Immutable */
export class RouteId {
  static readonly root = new RouteId("/");

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
    readonly search = ""
  ) {}

  toHref() {
    const { search, hash } = this;
    return `${location.protocol}//${location.host}${location.pathname}${search.length > 0 ? "?" + search : ""}#${hash}`;
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
      this.#testHashOrSearch(this.search, _loc.search)
    );
  }

  equals(other: RouteId) {
    return (
      this.hash === other.hash &&
      this.path === other.path &&
      this.search === other.search
    );
  }

  clone() {
    return new RouteId(this.path, this.hash, this.search);
  }

  nest(name: string) {
    return new RouteId(joinPath(this.path, name), this.hash, this.search);
  }

  withHash(hash: string) {
    return new RouteId(this.path, hash, this.search);
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

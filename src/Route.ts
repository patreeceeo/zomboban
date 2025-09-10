import { location } from "./globals";
import { ISystemConstructor } from "./System";
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
    return `${location.protocol}//${location.host}${location.pathname}${
      search.length > 0 ? "?" + search : ""
    }#${hash}`;
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

  toString() {
    return this.path + (this.hash.length > 0 ? "#" + this.hash : "") +
      (this.search.length > 0 ? "?" + this.search : "");
  }
}

const allowAll = () => true;

export class RouteSystemRegistery<State extends Record<string, any>> {
  #data = {} as Record<string, {systems: Set<ISystemConstructor<any>>, guard: (state: State) => boolean}>;

  register(routeId: RouteId, systems = [] as ISystemConstructor<any>[]) {
    this.#data[routeId.hash] = {
      systems: new Set(systems),
      guard: allowAll,
    }
    return this;
  }

  registerWithGuard(routeId: RouteId, systems = [] as ISystemConstructor<any>[], guard: (state: State) => boolean) {
    this.#data[routeId.hash] = {
      systems: new Set(systems),
      guard,
    }
    return this;
  }

  #emptySet = new Set<ISystemConstructor<any>>();
  getSystems(routeId: RouteId): Set<ISystemConstructor<any>> {
    return this.#data[routeId.hash]?.systems ?? this.#emptySet;
  }

  has(routeId: RouteId) {
    return routeId.hash in this.#data;
  }

  allows(state: State, routeId: RouteId): boolean {
    const route = this.#data[routeId.hash];
    return route ? route.guard(state) : false;
  }
}

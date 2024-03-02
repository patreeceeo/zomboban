import { invariant } from "./Error";

function parseLoction(): string | undefined {
  const { hash } = window.location;
  if (hash.length > 0 && hash !== "#") {
    return hash.slice(1);
  }
}

export interface IRouteRecord {
  [routeId: string]: (params: URLSearchParams) => void;
}

export function handleRouteChange<Routes extends IRouteRecord>(
  routes: Routes,
  defaultRoute: keyof Routes
) {
  const routeId = String(parseLoction() ?? defaultRoute);
  const query = new URLSearchParams(window.location.search);
  const routeFn = routes[routeId];
  invariant(!!routeFn, `Route not found: ${routeId}`);
  routeFn(query);
}

const _sp = new URLSearchParams();
function stringifyQuery(query: Record<string, string | number>) {
  for (const key in _sp) {
    _sp.delete(key);
  }
  for (const [key, value] of Object.entries(query)) {
    _sp.set(key, value.toString());
  }
  return _sp.toString();
}

export function routeTo(
  routeId: string,
  query?: Record<string, string | number>
) {
  window.location.href = `${
    query ? "?" + stringifyQuery(query) : ""
  }#${routeId}`;
}

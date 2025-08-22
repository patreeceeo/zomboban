import { Observable } from "../Observable";
import { RouteId } from "../Route";
import { menuRoute } from "../routes";

export class RouteState {
  default = menuRoute;
  #current = this.default;
  #currentObservable = new Observable<RouteId>();
  
  get current() {
    return this.#current;
  }
  
  set current(route: RouteId) {
    if (!this.#current.equals(route)) {
      this.#currentObservable.next(route);
      this.#current = route;
    }
  }
  
  onChange(callback: () => void) {
    return this.#currentObservable.subscribe(callback);
  }
}
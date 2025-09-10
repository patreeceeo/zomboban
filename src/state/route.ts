import { Observable } from "../Observable";
import { RouteId } from "../Route";

export class RouteState {
  #current = RouteId.root;
  #currentObservable = new Observable<RouteId>();

  default = RouteId.root;
  
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

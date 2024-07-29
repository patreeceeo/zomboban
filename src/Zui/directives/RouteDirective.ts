import { ShowDirective } from ".";
import { Route } from "../../Route";

export class RouteDirective extends ShowDirective {
  constructor(
    attrName: string,
    readonly defaultRoute: string
  ) {
    super(attrName);
  }
  evaluate(scope: any, expression: string) {
    const route = Route.fromLocation();
    const value = super.evaluate(scope, expression);
    return route === undefined
      ? this.defaultRoute === value
      : route.path === value;
  }
}

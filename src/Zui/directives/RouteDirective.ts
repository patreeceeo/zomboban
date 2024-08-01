import { ShowDirective } from ".";
import { RouteId } from "../../Route";

export class RouteDirective extends ShowDirective {
  constructor(
    attrName: string,
    readonly defaultRoute: string
  ) {
    super(attrName);
  }
  evaluate(scope: any, expression: string) {
    const route = RouteId.fromLocation();
    const value = super.evaluate(scope, expression);
    return route.hash === value;
  }
}

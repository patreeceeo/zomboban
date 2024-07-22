import { invariant } from "../Error";
import { ControllersByNodeMap } from "./collections";

// TODO Is this really necessary?
export class Base {
  getScope(node: Node, controllerMap: ControllersByNodeMap, outerScope: any) {
    const maybeController = controllerMap.get(node);
    const controller = maybeController?.awaitedValue;
    return controller?.scope ?? outerScope;
  }
  getScopeAt(scope: any, key: string) {
    invariant(key in scope, `'${key}' is not in scope`);
    return scope[key];
  }
}

import { AwaitedController } from ".";
import { invariant } from "../Error";

// TODO Is this really necessary?
export class Base {
  getScope(maybeController: AwaitedController | undefined, outerScope: any) {
    const controller = maybeController?.awaitedValue;
    return controller?.scope ?? outerScope;
  }
  getScopeAt(scope: any, key: string) {
    invariant(key in scope, `'${key}' is not in scope`);
    return scope[key];
  }
}

import { invariant } from "../Error";

export class Evaluator {
  #numberPattern = /^[0-9]/;
  #stringPattern = /^`.*?`$/;
  #booleanStrings: Record<string, boolean> = {
    true: true,
    false: false,
    on: true,
    off: false,
    yes: true,
    no: false
  };
  evaluate(scope: any, expression: string) {
    // TODO test all these cases
    if (expression in this.#booleanStrings) {
      return this.#booleanStrings[expression];
    } else if (this.#numberPattern.test(expression)) {
      return Number(expression);
    } else if (this.#stringPattern.test(expression)) {
      return expression.substring(1, expression.length - 1);
    } else {
      invariant(
        scope !== undefined && expression in scope,
        `'${expression}' is not in scope ${JSON.stringify(scope)}`
      );
      return scope[expression];
    }
  }
}

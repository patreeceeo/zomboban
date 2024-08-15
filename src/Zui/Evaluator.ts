import { invariant } from "../Error";

export class Evaluator {
  #numberPattern = /^[0-9]/;
  #stringPattern = /^`.*?`$/;
  #booleanStrings: Record<string, boolean> = {
    "": true,
    true: true,
    false: false,
    on: true,
    off: false,
    yes: true,
    no: false
  };
  evaluate(scope: any, expression: string, mustBeDefined = true) {
    // TODO test all these cases
    if (expression in this.#booleanStrings) {
      return this.#booleanStrings[expression];
    } else if (this.#numberPattern.test(expression)) {
      return Number(expression);
    } else if (this.#stringPattern.test(expression)) {
      return expression.substring(1, expression.length - 1);
    } else {
      invariant(
        !mustBeDefined || (scope !== undefined && expression in scope),
        `'${expression}' is not in scope ${scope}`
      );
      return scope[expression];
    }
  }
  coerceToBoolean(value: any) {
    return typeof value === "object" && "size" in value
      ? value.size > 0
      : !!value;
  }
}

import { invariant } from "./Error";

export enum ScriptingPrimitives {
  ifTrue_,
  ifFalse_,
  block
}

export interface IScriptingMessage {
  p: number;
  s: IScript;
}

function isMessage(item: IScriptItem): item is IScriptingMessage {
  return typeof item === "object" && "p" in item && "s" in item;
}

export function stringifyPrimative(primative: number) {
  if (primative in ScriptingPrimitives) {
    return ScriptingPrimitives[primative].replace("_", ":");
  }
  return `<primative ${primative}>`;
}

function getDoesNotUnderstand(object: IScriptItem, primative: number) {
  return `<${JSON.stringify(object)}> does not understand ${stringifyPrimative(primative)}`;
}

export type IScriptItem =
  | undefined
  | boolean
  | number
  | string
  | symbol
  | IScriptingMessage;

export type IScript = IScriptItem[];

export class ScriptingEngine {
  #messageImplementations = {
    [ScriptingPrimitives.block]: (args: IScript) => {
      return this.execute(args);
    },
    [ScriptingPrimitives.ifTrue_]: (args: IScript) => {
      const result = this.#result;
      invariant(
        typeof result === "boolean",
        getDoesNotUnderstand(result, ScriptingPrimitives.ifTrue_)
      );
      return result === true ? this.execute(args) : undefined;
    },
    [ScriptingPrimitives.ifFalse_]: (args: IScript) => {
      const result = this.#result;
      invariant(
        typeof result === "boolean",
        getDoesNotUnderstand(result, ScriptingPrimitives.ifFalse_)
      );
      return result === false ? this.execute(args) : undefined;
    }
  } as Record<number, (args: IScript) => IScriptItem>;
  #result: IScriptItem = undefined;
  execMessage(item: IScriptingMessage) {
    const impl = this.#messageImplementations[item.p];
    return impl(item.s);
  }
  execute(script: IScript) {
    for (const item of script) {
      if (isMessage(item)) {
        this.#result = this.execMessage(item);
      } else {
        this.#result = item;
      }
    }
    return this.#result;
  }
}

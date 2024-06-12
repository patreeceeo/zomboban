import { invariant } from "./Error";

/*
 * Name ideas:
 *  - peptalk
 */

const LanguageName = Symbol("PepTalk");

export enum ScriptingPrimitives {
  block,
  ifFalse_,
  ifTrue_,
  ifTrue_ifFalse_,
  isKindOf_,
  nextStatement,
  /** For now, PepTalk only supports one level of subclasses */
  subclass_
}

/** Base class for all classes in peptalk */
export const ScriptingObject = Symbol("Object");
export const ScriptingClass = Symbol("Class");

export interface IScriptingMessage {
  p: number;
  s: IScript;
}

function isMessage(item: IScriptItem): item is IScriptingMessage {
  return typeof item === "object" && "p" in item && "s" in item;
}

export function stringifyPrimative(primative: number) {
  if (primative in ScriptingPrimitives) {
    return ScriptingPrimitives[primative].replace(/_/g, ":");
  }
  return `<primative ${primative}>`;
}

export function stringifyObject(object: IScriptItem) {
  return typeof object === "symbol"
    ? object.toString().match(/Symbol\((.*?)\)/)![1]
    : JSON.stringify(object);
}

function getDoesNotUnderstand(object: IScriptItem, primative: number) {
  return `<${stringifyObject(object)}> does not understand ${stringifyPrimative(primative)}`;
}

export type IScriptItem =
  | undefined
  | boolean
  | number
  | string
  | symbol
  | IScriptingMessage;

export type IScript = IScriptItem[];

export interface ITaxonomy {
  [className: symbol]: ITaxonomy;
}

// TODO script building fns

export class ScriptingEngine {
  /** top level of this tree contains all direct subclasses of Object
   */
  #taxonomyRoot = {
    [ScriptingClass]: {}
  } as ITaxonomy;
  // #classMap = new WeakMap<any, symbol>();
  #messageImplementations = {
    [ScriptingPrimitives.block]: (args: IScript) => {
      return this.execute(args);
    },
    [ScriptingPrimitives.ifFalse_]: (args: IScript) => {
      const result = this.#result;
      invariant(
        typeof result === "boolean",
        getDoesNotUnderstand(result, ScriptingPrimitives.ifFalse_)
      );
      return result === false ? this.execute(args) : undefined;
    },
    [ScriptingPrimitives.ifTrue_]: (args: IScript) => {
      const result = this.#result;
      invariant(
        typeof result === "boolean",
        getDoesNotUnderstand(result, ScriptingPrimitives.ifTrue_)
      );
      return result === true ? this.execute(args) : undefined;
    },
    [ScriptingPrimitives.ifTrue_ifFalse_]: (args: IScript) => {
      const ifTrue_ = this.#messageImplementations[ScriptingPrimitives.ifTrue_];
      const ifFalse_ =
        this.#messageImplementations[ScriptingPrimitives.ifFalse_];
      return ifTrue_([args[0]]) ?? ifFalse_([args[1]]);
    },
    [ScriptingPrimitives.isKindOf_]: ([classSymbol]: IScript) => {
      // return this.#classMap.get(this.#result) === classSymbol;
      return (
        classSymbol === ScriptingClass &&
        typeof this.#result === "symbol" &&
        this.#result in this.#taxonomyRoot[ScriptingClass]
      );
    },
    [ScriptingPrimitives.nextStatement]: () => {
      const r = this.#result;
      this.#result = undefined;
      return r;
    },
    [ScriptingPrimitives.subclass_]: ([classSymbol]: IScript) => {
      invariant(
        typeof classSymbol === "symbol",
        "Expected 1st arg of subclass: to be a symbol"
      );
      const classTaxo = this.#taxonomyRoot[ScriptingClass];
      invariant(classTaxo !== undefined, "Programmer error!");
      classTaxo[classSymbol] = {};
    }
  } as Record<number, (args: IScript) => IScriptItem>;
  #result: IScriptItem = undefined;
  execMessage(item: IScriptingMessage) {
    const impl = this.#messageImplementations[item.p];
    invariant(impl !== undefined, getDoesNotUnderstand(LanguageName, item.p));
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

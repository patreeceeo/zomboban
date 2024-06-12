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

export function stringifyPrimative(primative: number) {
  if (primative in ScriptingPrimitives) {
    return ScriptingPrimitives[primative].replace(/_/g, ":");
  }
  return `<primative ${primative}>`;
}

export function stringifyObject(object: IScriptWord) {
  return typeof object === "symbol"
    ? object.toString().match(/Symbol\((.*?)\)/)![1]
    : JSON.stringify(object);
}

function getDoesNotUnderstand(object: IScriptWord, primative: number) {
  return `<${stringifyObject(object)}> does not understand ${stringifyPrimative(primative)}`;
}

export type IScriptWord =
  | undefined
  | boolean
  | number
  | string
  | symbol
  | ScriptingMessage;

// export type IScript = IScriptObject[];

export interface ITaxonomy {
  [className: symbol]: ITaxonomy;
}

/** Abstract data type */
export class Script {
  #words: readonly IScriptWord[];
  constructor(words = [] as IScriptWord[]) {
    this.#words = words;
  }
  static fromWords(words: readonly IScriptWord[]) {
    return new Script(Array.from(words));
  }
  static fromWord(word: IScriptWord) {
    return new Script([word]);
  }
  static empty = new Script();
  words(): readonly IScriptWord[] {
    return this.#words;
  }
  getWord(index: number) {
    return this.#words.at(index);
  }
}

/** Abstract data type */
export class ScriptingMessage {
  constructor(
    readonly p: number,
    readonly s: Script = Script.empty
  ) {}
  static from(p: number, s?: Script) {
    return new ScriptingMessage(p, s);
  }
  static withOneArg(p: number, c: IScriptWord) {
    return new ScriptingMessage(p, Script.fromWord(c));
  }
  static nextStatement = ScriptingMessage.from(
    ScriptingPrimitives.nextStatement
  );
}

export class ScriptingEngine {
  /** top level of this tree contains all direct subclasses of Object
   */
  #taxonomyRoot = {
    [ScriptingClass]: {}
  } as ITaxonomy;
  // #classMap = new WeakMap<any, symbol>();
  #messageImplementations = {
    [ScriptingPrimitives.block]: (args: Script) => {
      return this.execute(args);
    },
    [ScriptingPrimitives.ifFalse_]: (args: Script) => {
      const result = this.#result;
      invariant(
        typeof result === "boolean",
        getDoesNotUnderstand(result, ScriptingPrimitives.ifFalse_)
      );
      return result === false ? this.execute(args) : undefined;
    },
    [ScriptingPrimitives.ifTrue_]: (args: Script) => {
      const result = this.#result;
      invariant(
        typeof result === "boolean",
        getDoesNotUnderstand(result, ScriptingPrimitives.ifTrue_)
      );
      return result === true ? this.execute(args) : undefined;
    },
    [ScriptingPrimitives.ifTrue_ifFalse_]: (args: Script) => {
      const ifTrue_ = this.#messageImplementations[ScriptingPrimitives.ifTrue_];
      const ifFalse_ =
        this.#messageImplementations[ScriptingPrimitives.ifFalse_];
      return (
        ifTrue_(Script.fromWord(args.getWord(0))) ??
        ifFalse_(Script.fromWord(args.getWord(1)))
      );
    },
    [ScriptingPrimitives.isKindOf_]: (args: Script) => {
      // return this.#classMap.get(this.#result) === classSymbol;
      const classSymbol = args.getWord(0);
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
    [ScriptingPrimitives.subclass_]: (args: Script) => {
      const classSymbol = args.getWord(0);
      invariant(
        typeof classSymbol === "symbol",
        "Expected 1st arg of subclass: to be a symbol"
      );
      const classTaxo = this.#taxonomyRoot[ScriptingClass];
      invariant(classTaxo !== undefined, "Programmer error!");
      classTaxo[classSymbol] = {};
    }
  } as Record<number, (args: Script) => IScriptWord>;
  #result: IScriptWord = undefined;
  execMessage(item: ScriptingMessage) {
    const impl = this.#messageImplementations[item.p];
    invariant(impl !== undefined, getDoesNotUnderstand(LanguageName, item.p));
    return impl(item.s);
  }
  execute(script: Script) {
    for (const chunk of script.words()) {
      if (chunk instanceof ScriptingMessage) {
        this.#result = this.execMessage(chunk);
      } else {
        this.#result = chunk;
      }
    }
    return this.#result;
  }
}

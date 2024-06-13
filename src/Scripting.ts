import { invariant } from "./Error";

/*
 * Name ideas:
 *  - peptalk
 */

const LANGUAGE_NAME = Symbol("PepTalk");

// TODO some of these should be methods
export enum ScriptingPrimitives {
  block,
  ifFalse_,
  ifTrue_,
  ifTrue_ifFalse_,
  isKindOf_,
  nextStatement,
  // TODO implement complete selector
  // subclass_instanceVariableNames_classVariableNames_poolDictionaries_category_,
  subclass_,
  superclass
}

export type IScriptChunk =
  | undefined
  | boolean
  | number
  | string
  | symbol
  | ScriptingMessage;

/** Abstract data type */
export class Script {
  #chunks: readonly IScriptChunk[];
  constructor(chunk = [] as IScriptChunk[]) {
    this.#chunks = chunk;
  }
  static fromChunks(chunks: readonly IScriptChunk[]) {
    return new Script(Array.from(chunks));
  }
  static fromChunk(chunk: IScriptChunk) {
    return new Script([chunk]);
  }
  static empty = new Script();
  chunks(): readonly IScriptChunk[] {
    return this.#chunks;
  }
  getChunk(index: number) {
    return this.#chunks.at(index);
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
  static withOneArg(p: number, c: IScriptChunk) {
    return new ScriptingMessage(p, Script.fromChunk(c));
  }
  static block(s: Script) {
    return ScriptingMessage.from(ScriptingPrimitives.block, s);
  }
  static nextStatement = ScriptingMessage.from(
    ScriptingPrimitives.nextStatement
  );
}

/**
 * If klass is undefined, then it's an instance of Object.
 * If superKlass is undefined, then it's an instance of Class.
 */

class ScriptingObjectRecord {
  constructor(readonly klass?: ScriptingClassRecord) {}
  isKindOf(id: symbol) {
    let klass: ScriptingClassRecord | undefined = this.klass;

    if (id === SCRIPTING_OBJECT_CLASS_ID) return true;

    while (klass !== undefined) {
      if (klass.id === id) {
        return true;
      }
      klass = klass.superClass;
    }
    return false;
  }
}

let _SCRIPTING_CLASS: ScriptingClassRecord;

class ScriptingClassRecord extends ScriptingObjectRecord {
  #subclassDefs = {} as Record<symbol, ScriptingClassRecord>;
  constructor(
    readonly id: symbol,
    readonly superClass?: ScriptingClassRecord,
    klass = _SCRIPTING_CLASS
  ) {
    super(klass);
  }
  addSubclass(id: symbol, klass: ScriptingClassRecord) {
    this.#subclassDefs[id] = klass;
  }
  isSubclass(id: symbol) {
    return id in this.#subclassDefs;
  }
}

/** Base class for all classes in peptalk */
export const SCRIPTING_OBJECT_CLASS_ID = Symbol("Object");
export const SCRIPTING_OBJECT_CLASS = new ScriptingClassRecord(
  SCRIPTING_OBJECT_CLASS_ID,
  undefined,
  undefined
);

export const SCRIPTING_CLASS_ID = Symbol("Class");
export const SCRIPTING_CLASS = new ScriptingClassRecord(SCRIPTING_CLASS_ID);
_SCRIPTING_CLASS = SCRIPTING_CLASS;

export function stringifyPrimative(primative: number) {
  if (primative in ScriptingPrimitives) {
    return ScriptingPrimitives[primative].replace(/_/g, ":");
  }
  return `<primative ${primative}>`;
}

function stringifyIdentifier(symbol: symbol) {
  return symbol.toString().match(/Symbol\((.*?)\)/)![1];
}

export function stringifyObject(object: IScriptChunk) {
  return typeof object === "symbol"
    ? stringifyIdentifier(object)
    : JSON.stringify(object);
}

const GET_ERROR_STRING = {
  doesNotUnderstand(object: IScriptChunk, primative: number) {
    return `<${stringifyObject(object)}> does not understand ${stringifyPrimative(primative)}`;
  },
  unexpectedArgument(
    object: IScriptChunk,
    primative: number,
    parameter: number | string,
    argument: IScriptChunk
  ) {
    return `\`${stringifyObject(object)} ${stringifyPrimative(primative)}\` Expected arg \`${parameter}\` to be a symbol, got ${stringifyObject(argument)}`;
  }
};

export class ScriptingEngine {
  #classDefs = {
    [SCRIPTING_OBJECT_CLASS_ID]: SCRIPTING_OBJECT_CLASS,
    [SCRIPTING_CLASS_ID]: SCRIPTING_CLASS
  } as Record<symbol, ScriptingClassRecord>;
  #messageImplementations = {
    [ScriptingPrimitives.block]: (args: Script) => {
      return this.execute(args);
    },

    [ScriptingPrimitives.ifFalse_]: (args: Script) => {
      const result = this.#result;
      invariant(
        typeof result === "boolean",
        GET_ERROR_STRING.doesNotUnderstand(result, ScriptingPrimitives.ifFalse_)
      );
      return result === false ? this.execute(args) : undefined;
    },

    [ScriptingPrimitives.ifTrue_]: (args: Script) => {
      const result = this.#result;
      invariant(
        typeof result === "boolean",
        GET_ERROR_STRING.doesNotUnderstand(result, ScriptingPrimitives.ifTrue_)
      );
      return result === true ? this.execute(args) : undefined;
    },

    [ScriptingPrimitives.ifTrue_ifFalse_]: (args: Script) => {
      const ifTrue_ = this.#messageImplementations[ScriptingPrimitives.ifTrue_];
      const ifFalse_ =
        this.#messageImplementations[ScriptingPrimitives.ifFalse_];
      return (
        ifTrue_(Script.fromChunk(args.getChunk(0))) ??
        ifFalse_(Script.fromChunk(args.getChunk(1)))
      );
    },

    [ScriptingPrimitives.isKindOf_]: (args: Script) => {
      const targetClassId = this.#result;
      const arg0 = args.getChunk(0);
      invariant(
        typeof targetClassId === "symbol",
        GET_ERROR_STRING.doesNotUnderstand(
          targetClassId,
          ScriptingPrimitives.subclass_
        )
      );
      invariant(
        typeof arg0 === "symbol",
        GET_ERROR_STRING.unexpectedArgument(
          targetClassId,
          ScriptingPrimitives.isKindOf_,
          0,
          arg0
        )
      );
      const targetClassDef = this.#classDefs[targetClassId];
      invariant(
        targetClassDef instanceof ScriptingClassRecord,
        `${stringifyIdentifier(targetClassId)} is not a Class`
      );
      return targetClassDef.isKindOf(arg0);
    },

    [ScriptingPrimitives.nextStatement]: () => {
      const r = this.#result;
      this.#result = undefined;
      return r;
    },

    [ScriptingPrimitives.subclass_]: (args: Script) => {
      const classDefs = this.#classDefs;
      const newClassId = args.getChunk(0);
      const superClassId = this.#result;
      const doesNotUnderstandString = GET_ERROR_STRING.doesNotUnderstand(
        superClassId,
        ScriptingPrimitives.subclass_
      );
      invariant(typeof superClassId === "symbol", doesNotUnderstandString);
      invariant(
        typeof newClassId === "symbol",
        GET_ERROR_STRING.unexpectedArgument(
          superClassId,
          ScriptingPrimitives.subclass_,
          0,
          newClassId
        )
      );
      const superClassDef = classDefs[superClassId];
      invariant(superClassDef !== undefined, doesNotUnderstandString);

      const newClassDef = new ScriptingClassRecord(newClassId, superClassDef);
      superClassDef.addSubclass(newClassId, newClassDef);
      classDefs[newClassId] = newClassDef;
    },

    [ScriptingPrimitives.superclass]: () => {
      const classDefs = this.#classDefs;
      const classId = this.#result;

      invariant(
        typeof classId === "symbol",
        GET_ERROR_STRING.doesNotUnderstand(
          classId,
          ScriptingPrimitives.superclass
        )
      );

      const classDef = classDefs[classId];

      return classDef.superClass?.id;
    }
  } as Record<number, (args: Script) => IScriptChunk>;
  #result: IScriptChunk = undefined;
  execMessage(item: ScriptingMessage) {
    const impl = this.#messageImplementations[item.p];
    invariant(
      impl !== undefined,
      GET_ERROR_STRING.doesNotUnderstand(LANGUAGE_NAME, item.p)
    );
    return impl(item.s);
  }
  execute(script: Script) {
    for (const chunk of script.chunks()) {
      if (chunk instanceof ScriptingMessage) {
        this.#result = this.execMessage(chunk);
      } else {
        this.#result = chunk;
      }
    }
    return this.#result;
  }
}

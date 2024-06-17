import { invariant } from "./Error";

/*
 * Name ideas:
 *  - peptalk
 *  - smacktalk
 */

const LANGUAGE_NAME = Symbol("SmackTalk");

// TODO everything that can be a method, should be a method
export enum ScriptingPrimitives {
  addInstanceMethod,
  assign,
  /** should really be a builtin object that is instantiated when a block is created? */
  block,
  callJs,
  ifFalse_,
  ifTrue_,
  ifTrue_ifFalse_,
  isKindOf_,
  nextStatement,
  new,
  passMessage,
  return,
  // TODO implement complete selector
  // subclass_instanceVariableNames_classVariableNames_poolDictionaries_category_,
  subclass_,
  superclass
}

type IJSPrimitives = undefined | boolean | number | string | symbol;

// TODO create/use a ScriptingId class and using strings, not symbols, to name new objects
export type IScriptChunk = IJSPrimitives | ScriptingMessage | Function;

/** A possible deviation from Smalltalk: Messages are also Objects. */
type IObject = IScriptChunk | ScriptingObjectRecord;

/** Abstract data type */
export class Script {
  #chunks: readonly IScriptChunk[];
  constructor(chunks = [] as IScriptChunk[]) {
    this.#chunks = chunks;
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
  slice(from?: number, to?: number) {
    return new Script(this.#chunks.slice(from, to));
  }
  toJSON(): any {
    return this.#chunks.map((c) => {
      if (c instanceof ScriptingMessage) {
        return c.toJSON();
      } else if (typeof c === "symbol") {
        return stringifyIdentifier(c);
      } else {
        return c;
      }
    });
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
  toJSON(): any {
    return {
      p: stringifyPrimative(this.p),
      s: this.s.toJSON()
    };
  }
}

/**
 * If klass is undefined, then it's an instance of Object.
 * If superKlass is undefined, then it's an instance of Class.
 */

class ScriptingObjectRecord {
  constructor(readonly klass?: ScriptingClassRecord) {}
  isKindOf(id: symbol) {
    let klass: ScriptingClassRecord | undefined = this.klass;

    // Everything is an object
    if (id === SCRIPTING_OBJECT_CLASS_ID) return true;
    // If classless, we're dealing with Object itself, which is a class.
    if (id === SCRIPTING_CLASS_ID && klass === undefined) return true;

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
  #instanceMethods = {} as Record<symbol, Script>;
  get instanceMethods() {
    return this.#instanceMethods;
  }
  addInstanceMethod(methodId: symbol, impl: Script) {
    this.#instanceMethods[methodId] = impl;
  }
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

/** Base class for all classes */
export const SCRIPTING_OBJECT_CLASS_ID = Symbol("Object");
export const SCRIPTING_CLASS_ID = Symbol("Class");

export function stringifyPrimative(primative: number) {
  if (primative in ScriptingPrimitives) {
    return ScriptingPrimitives[primative].replace(/_/g, ":");
  }
  return `<primative ${primative}>`;
}

function stringifyIdentifier(symbol: symbol) {
  return symbol.toString().match(/Symbol\((.*?)\)/)![1];
}

// TODO this should be a method of ScriptingEngine so that it can differentiate between #Symbols and Identifiers
export function stringifyObject(object: IObject) {
  return typeof object === "symbol"
    ? stringifyIdentifier(object)
    : typeof object === "number"
      ? stringifyPrimative(object)
      : JSON.stringify(object);
}

const GET_ERROR_STRING = {
  doesNotUnderstand(object: IObject, primativeOrMethod: number | symbol) {
    return `${stringifyObject(object)} does not understand \`${stringifyObject(primativeOrMethod)}\``;
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
  #objDefs = {} as Record<symbol, IObject>;
  #primitiveImplementations = {
    [ScriptingPrimitives.addInstanceMethod]: (script: Script) => {
      const methodId = script.getChunk(0);
      const impl = script.slice(1);
      const classId = this.#result;
      const objDefs = this.#objDefs;
      const doesNotUnderstandString = GET_ERROR_STRING.doesNotUnderstand(
        classId,
        ScriptingPrimitives.addInstanceMethod
      );
      invariant(
        typeof classId === "symbol" && classId in objDefs,
        doesNotUnderstandString
      );
      const classDef = objDefs[classId];
      invariant(
        typeof methodId === "symbol",
        GET_ERROR_STRING.unexpectedArgument(
          LANGUAGE_NAME,
          ScriptingPrimitives.addInstanceMethod,
          0,
          methodId
        )
      );
      invariant(
        classDef instanceof ScriptingClassRecord,
        doesNotUnderstandString
      );
      classDef.addInstanceMethod(methodId, impl);
    },

    [ScriptingPrimitives.assign]: (script: Script) => {
      const objDefs = this.#objDefs;
      const objId = this.#result;
      const assignedValue = this.execute(script);

      invariant(
        typeof objId === "symbol",
        GET_ERROR_STRING.doesNotUnderstand(objId, ScriptingPrimitives.assign)
      );

      return (objDefs[objId] = assignedValue);
    },

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
      const ifTrue_ =
        this.#primitiveImplementations[ScriptingPrimitives.ifTrue_];
      const ifFalse_ =
        this.#primitiveImplementations[ScriptingPrimitives.ifFalse_];
      return (
        ifTrue_(Script.fromChunk(args.getChunk(0))) ??
        ifFalse_(Script.fromChunk(args.getChunk(1)))
      );
    },

    [ScriptingPrimitives.isKindOf_]: (args: Script) => {
      const targetObjectId = this.#result;
      const arg0 = args.getChunk(0);
      invariant(
        typeof targetObjectId === "symbol",
        GET_ERROR_STRING.doesNotUnderstand(
          targetObjectId,
          ScriptingPrimitives.subclass_
        )
      );
      invariant(
        typeof arg0 === "symbol",
        GET_ERROR_STRING.unexpectedArgument(
          targetObjectId,
          ScriptingPrimitives.isKindOf_,
          0,
          arg0
        )
      );
      const targetObjectDef = this.#objDefs[targetObjectId];
      invariant(
        targetObjectDef instanceof ScriptingObjectRecord,
        `${stringifyPrimative(ScriptingPrimitives.isKindOf_)} has not been implemented for ${stringifyObject(targetObjectDef)}`
      );
      return targetObjectDef.isKindOf(arg0);
    },

    [ScriptingPrimitives.new]: () => {
      const classId = this.#result;
      const doesNotUnderstandString = GET_ERROR_STRING.doesNotUnderstand(
        classId,
        ScriptingPrimitives.new
      );
      invariant(typeof classId === "symbol", doesNotUnderstandString);
      const classDef = this.#objDefs[classId];
      invariant(
        classDef instanceof ScriptingClassRecord,
        doesNotUnderstandString
      );

      return new ScriptingObjectRecord(classDef);
    },

    [ScriptingPrimitives.nextStatement]: () => {
      const r = this.#result;
      this.#result = undefined;
      return r;
    },

    [ScriptingPrimitives.passMessage]: (args: Script) => {
      const methodId = args.getChunk(0);
      const objectId = this.#result;
      const objDefs = this.#objDefs;
      invariant(
        typeof methodId === "symbol",
        GET_ERROR_STRING.unexpectedArgument(
          LANGUAGE_NAME,
          ScriptingPrimitives.passMessage,
          0,
          methodId
        )
      );
      invariant(
        typeof objectId === "symbol" && objectId in objDefs,
        GET_ERROR_STRING.doesNotUnderstand(
          objectId,
          ScriptingPrimitives.passMessage
        )
      );
      const object = objDefs[objectId];
      if (object instanceof ScriptingClassRecord) {
        const impl = object.instanceMethods[methodId];
        return this.execute(impl);
      }
    },

    [ScriptingPrimitives.return]: (script: Script) => {
      return script.getChunk(0);
    },

    [ScriptingPrimitives.subclass_]: (args: Script) => {
      const objDefs = this.#objDefs;
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
      const superClassDef = objDefs[superClassId];
      invariant(
        superClassDef instanceof ScriptingClassRecord,
        doesNotUnderstandString
      );

      const newClassDef = new ScriptingClassRecord(newClassId, superClassDef);
      superClassDef.addSubclass(newClassId, newClassDef);
      objDefs[newClassId] = newClassDef;
    },

    [ScriptingPrimitives.superclass]: () => {
      const objDefs = this.#objDefs;
      const classId = this.#result;

      invariant(
        typeof classId === "symbol",
        GET_ERROR_STRING.doesNotUnderstand(
          classId,
          ScriptingPrimitives.superclass
        )
      );

      const classDef = objDefs[classId];

      invariant(
        classDef instanceof ScriptingClassRecord,
        GET_ERROR_STRING.doesNotUnderstand(
          classId,
          ScriptingPrimitives.superclass
        )
      );

      return classDef.superClass?.id;
    }
  } as Record<number, (args: Script) => IObject>;
  #result: IObject = undefined;

  constructor() {
    const objDefs = this.#objDefs;
    _SCRIPTING_CLASS = objDefs[SCRIPTING_CLASS_ID] = new ScriptingClassRecord(
      SCRIPTING_CLASS_ID
    );
    objDefs[SCRIPTING_OBJECT_CLASS_ID] = new ScriptingClassRecord(
      SCRIPTING_OBJECT_CLASS_ID,
      undefined,
      undefined
    );

    // TODO Object subclass: Boolean. Boolean subclass: True. Boolean subclass: False.
  }

  getObject(id: symbol) {
    return this.#objDefs[id];
  }

  execMessage(item: ScriptingMessage) {
    const primitive = item.p;
    const impl = this.#primitiveImplementations[primitive];
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
    const result = this.#result;
    const objDefs = this.#objDefs;
    if (typeof result === "symbol" && result in objDefs) {
      return this.#objDefs[result];
    }
    return result;
  }
}

import assert from "node:assert";
import test from "node:test";
import {
  Script,
  SCRIPTING_CLASS_ID,
  ScriptingEngine,
  ScriptingMessage,
  SCRIPTING_OBJECT_CLASS_ID,
  ScriptingPrimitives,
  stringifyPrimative
} from "./Scripting";

test.describe("Scripting", () => {
  test("type system foundation", () => {
    // Object isKindOf: Object
    const script1 = Script.fromChunks([
      SCRIPTING_OBJECT_CLASS_ID,
      ScriptingMessage.withOneArg(
        ScriptingPrimitives.isKindOf_,
        SCRIPTING_OBJECT_CLASS_ID
      )
    ]);

    // Object isKindOf: Class
    const script2 = Script.fromChunks([
      SCRIPTING_OBJECT_CLASS_ID,
      ScriptingMessage.withOneArg(
        ScriptingPrimitives.isKindOf_,
        SCRIPTING_CLASS_ID
      )
    ]);

    // Class isKindOf: Object
    const script3 = Script.fromChunks([
      SCRIPTING_CLASS_ID,
      ScriptingMessage.withOneArg(
        ScriptingPrimitives.isKindOf_,
        SCRIPTING_OBJECT_CLASS_ID
      )
    ]);

    // Class isKindOf: Class
    const script4 = Script.fromChunks([
      SCRIPTING_CLASS_ID,
      ScriptingMessage.withOneArg(
        ScriptingPrimitives.isKindOf_,
        SCRIPTING_CLASS_ID
      )
    ]);

    const engine = new ScriptingEngine();
    assert(engine.execute(script1));
    assert(engine.execute(script2));
    assert(engine.execute(script3));
    assert(engine.execute(script4));
  });

  test(stringifyPrimative(ScriptingPrimitives.subclass_), () => {
    const Chair = Symbol("Chair");
    const Beanbag = Symbol("Beanbag");

    // Class subclass: #Chair. Chair isKindOf: Class
    const script = Script.fromChunks([
      SCRIPTING_OBJECT_CLASS_ID,
      ScriptingMessage.withOneArg(ScriptingPrimitives.subclass_, Chair),
      ScriptingMessage.nextStatement,

      Chair,
      ScriptingMessage.withOneArg(
        ScriptingPrimitives.isKindOf_,
        SCRIPTING_CLASS_ID
      )
    ]);

    // Chair subclass: #Beanbag. Beanbag isKindOf: Chair
    const script2 = Script.fromChunks([
      Chair,
      ScriptingMessage.withOneArg(ScriptingPrimitives.subclass_, Beanbag),
      ScriptingMessage.nextStatement,

      Beanbag,
      ScriptingMessage.withOneArg(
        ScriptingPrimitives.isKindOf_,
        SCRIPTING_CLASS_ID
      )
    ]);

    // Beanbag superclass
    const script3 = Script.fromChunks([
      Beanbag,
      ScriptingMessage.from(ScriptingPrimitives.superclass)
    ]);

    const engine = new ScriptingEngine();
    assert(engine.execute(script));
    assert(engine.execute(script2));
    assert.equal(engine.execute(script3), engine.getObject(Chair));
  });

  test(stringifyPrimative(ScriptingPrimitives.assign), () => {
    const varId = Symbol("theAnswer");

    const script = Script.fromChunks([
      varId,
      ScriptingMessage.withOneArg(ScriptingPrimitives.assign, 42)
    ]);

    const script2 = Script.fromChunks([varId]);

    const engine = new ScriptingEngine();
    assert.equal(engine.execute(script), 42);
    assert.equal(engine.execute(script2), 42);
  });

  test(stringifyPrimative(ScriptingPrimitives.new), () => {
    const varId = Symbol("myObj");
    const script = Script.fromChunks([
      varId,
      ScriptingMessage.from(
        ScriptingPrimitives.assign,
        Script.fromChunks([
          SCRIPTING_OBJECT_CLASS_ID,
          ScriptingMessage.from(ScriptingPrimitives.new)
        ])
      ),
      ScriptingMessage.nextStatement,

      varId,
      ScriptingMessage.withOneArg(
        ScriptingPrimitives.isKindOf_,
        SCRIPTING_OBJECT_CLASS_ID
      )
    ]);

    const engine = new ScriptingEngine();

    assert(engine.execute(script));
  });

  test(stringifyPrimative(ScriptingPrimitives.addInstanceMethod), () => {
    const methodId = Symbol("saySomething");

    const methodDef = ScriptingMessage.withOneArg(
      ScriptingPrimitives.return,
      "meeeow"
    );

    const script = Script.fromChunks([
      SCRIPTING_OBJECT_CLASS_ID,
      ScriptingMessage.from(
        ScriptingPrimitives.addInstanceMethod,
        Script.fromChunks([methodId, methodDef])
      ),
      ScriptingMessage.nextStatement,

      SCRIPTING_OBJECT_CLASS_ID,
      ScriptingMessage.withOneArg(ScriptingPrimitives.passMessage, methodId)
    ]);

    const engine = new ScriptingEngine();
    assert.equal(engine.execute(script), "meeeow");
  });

  test("call stack", () => {
    const methodId1 = Symbol("saySomething");
    const methodId2 = Symbol("getPunctuation");

    const methodDef1 = ScriptingMessage.from(
      ScriptingPrimitives.return,
      Script.fromChunks([
        ScriptingMessage.from(
          ScriptingPrimitives.callJs,
          Script.fromChunks([
            (punctuation: string) => {
              return `meeeow${punctuation}`;
            },
            // TODO: self primitive?
            SCRIPTING_OBJECT_CLASS_ID,
            ScriptingMessage.withOneArg(
              ScriptingPrimitives.passMessage,
              methodId2
            )
          ])
        )
      ])
    );

    const methodDef2 = ScriptingMessage.withOneArg(
      ScriptingPrimitives.return,
      "!!!"
    );

    const script = Script.fromChunks([
      SCRIPTING_OBJECT_CLASS_ID,
      ScriptingMessage.from(
        ScriptingPrimitives.addInstanceMethod,
        Script.fromChunks([methodId1, methodDef1])
      ),
      ScriptingMessage.nextStatement,

      SCRIPTING_OBJECT_CLASS_ID,
      ScriptingMessage.from(
        ScriptingPrimitives.addInstanceMethod,
        Script.fromChunks([methodId2, methodDef2])
      ),
      ScriptingMessage.nextStatement,

      SCRIPTING_OBJECT_CLASS_ID,
      ScriptingMessage.withOneArg(ScriptingPrimitives.passMessage, methodId1)
    ]);

    const engine = new ScriptingEngine();
    assert.equal(engine.execute(script), "meeeow!!!");
  });

  // TODO use return primative
  test(stringifyPrimative(ScriptingPrimitives.ifTrue_), () => {
    // true ifTrue: "success"
    const scriptTrueIfTrue = Script.fromChunks([
      true,
      ScriptingMessage.withOneArg(
        ScriptingPrimitives.ifTrue_,
        ScriptingMessage.block(Script.fromChunk("success"))
      )
    ]);

    // false ifTrue: "failure"
    const scriptFalseIfTrue = Script.fromChunks([
      false,
      ScriptingMessage.withOneArg(
        ScriptingPrimitives.ifTrue_,
        ScriptingMessage.block(Script.fromChunk("failure"))
      )
    ]);

    // "string" ifTrue: "failure"
    const scriptThrows = Script.fromChunks([
      "string",
      ScriptingMessage.withOneArg(
        ScriptingPrimitives.ifTrue_,
        ScriptingMessage.block(Script.fromChunk("failure"))
      )
    ]);

    const engine = new ScriptingEngine();
    const resultTrueIfTrue = engine.execute(scriptTrueIfTrue);
    const resultFalseIfTrue = engine.execute(scriptFalseIfTrue);
    assert.equal(resultTrueIfTrue, "success");
    assert.equal(resultFalseIfTrue, undefined);
    assert.throws(() => engine.execute(scriptThrows));
  });

  test(stringifyPrimative(ScriptingPrimitives.ifFalse_), () => {
    // true ifFalse: "failure"
    const scriptTrueIfFalse = Script.fromChunks([
      true,
      ScriptingMessage.withOneArg(
        ScriptingPrimitives.ifFalse_,
        ScriptingMessage.block(Script.fromChunk("failure"))
      )
    ]);

    // false ifFalse: "success"
    const scriptFalseIfFalse = Script.fromChunks([
      false,
      ScriptingMessage.withOneArg(
        ScriptingPrimitives.ifFalse_,
        ScriptingMessage.block(Script.fromChunk("success"))
      )
    ]);

    // "string" ifFalse: "failure"
    const scriptThrows = Script.fromChunks([
      "string",
      ScriptingMessage.withOneArg(
        ScriptingPrimitives.ifFalse_,
        ScriptingMessage.block(Script.fromChunk("failure"))
      )
    ]);

    const engine = new ScriptingEngine();
    const resultTrueIfFalse = engine.execute(scriptTrueIfFalse);
    const resultFalseIfFalse = engine.execute(scriptFalseIfFalse);
    assert.equal(resultTrueIfFalse, undefined);
    assert.equal(resultFalseIfFalse, "success");
    assert.throws(() => engine.execute(scriptThrows));
  });

  test(stringifyPrimative(ScriptingPrimitives.ifTrue_ifFalse_), () => {
    // true ifTrue: "success" ifFalse: "failure"
    const scriptTrue = Script.fromChunks([
      true,
      ScriptingMessage.from(
        ScriptingPrimitives.ifTrue_ifFalse_,
        Script.fromChunks([
          ScriptingMessage.block(Script.fromChunk("success")),
          ScriptingMessage.block(Script.fromChunk("failure"))
        ])
      )
    ]);

    // false ifTrue: "failure" ifFalse: "success"
    const scriptFalse = Script.fromChunks([
      false,
      ScriptingMessage.from(
        ScriptingPrimitives.ifTrue_ifFalse_,
        Script.fromChunks([
          ScriptingMessage.block(Script.fromChunk("failure")),
          ScriptingMessage.block(Script.fromChunk("success"))
        ])
      )
    ]);

    const engine = new ScriptingEngine();
    const resultTrue = engine.execute(scriptTrue);
    const resultFalse = engine.execute(scriptFalse);
    assert.equal(resultTrue, "success");
    assert.equal(resultFalse, "success");
  });
});

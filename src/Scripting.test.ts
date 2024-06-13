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

// TODO
// Object isKindOf: Object
// Object isKindOf: Class
// Class isKindOf: Object
// Class isKindOf: Class

test.describe("Scripting", () => {
  test(stringifyPrimative(ScriptingPrimitives.subclass_), () => {
    const Chair = Symbol("Chair");
    const Beanbag = Symbol("Beanbag");

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

    const script3 = Script.fromChunks([
      Beanbag,
      ScriptingMessage.from(ScriptingPrimitives.superclass)
    ]);

    const engine = new ScriptingEngine();
    assert(engine.execute(script));
    assert(engine.execute(script2));
    assert(engine.execute(script3) === Chair);
  });

  test(stringifyPrimative(ScriptingPrimitives.ifTrue_), () => {
    const scriptTrueIfTrue = Script.fromChunks([
      true,
      ScriptingMessage.withOneArg(
        ScriptingPrimitives.ifTrue_,
        ScriptingMessage.block(Script.fromChunk("success"))
      )
    ]);
    const scriptFalseIfTrue = Script.fromChunks([
      false,
      ScriptingMessage.withOneArg(
        ScriptingPrimitives.ifTrue_,
        ScriptingMessage.block(Script.fromChunk("failure"))
      )
    ]);
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
    const scriptTrueIfFalse = Script.fromChunks([
      true,
      ScriptingMessage.withOneArg(
        ScriptingPrimitives.ifFalse_,
        ScriptingMessage.block(Script.fromChunk("failure"))
      )
    ]);
    const scriptFalseIfFalse = Script.fromChunks([
      false,
      ScriptingMessage.withOneArg(
        ScriptingPrimitives.ifFalse_,
        ScriptingMessage.block(Script.fromChunk("success"))
      )
    ]);
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

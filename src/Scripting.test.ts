import assert from "node:assert";
import test from "node:test";
import {
  Script,
  ScriptingClass,
  ScriptingEngine,
  ScriptingMessage,
  ScriptingObject,
  ScriptingPrimitives,
  stringifyPrimative
} from "./Scripting";

test.describe("Scripting", () => {
  test(stringifyPrimative(ScriptingPrimitives.subclass_), () => {
    const myClassSymbol = Symbol("MyClass");
    const script = Script.fromChunks([
      ScriptingObject,
      ScriptingMessage.withOneArg(ScriptingPrimitives.subclass_, myClassSymbol),
      ScriptingMessage.nextStatement,

      myClassSymbol,
      ScriptingMessage.withOneArg(ScriptingPrimitives.isKindOf_, ScriptingClass)
    ]);

    const engine = new ScriptingEngine();
    const result = engine.execute(script);
    assert(result);
  });

  test(stringifyPrimative(ScriptingPrimitives.ifTrue_), () => {
    const scriptTrueIfTrue = Script.fromChunks([
      true,
      ScriptingMessage.withOneArg(
        ScriptingPrimitives.ifTrue_,
        ScriptingMessage.withOneArg(ScriptingPrimitives.block, "success")
      )
    ]);
    const scriptFalseIfTrue = Script.fromChunks([
      false,
      ScriptingMessage.withOneArg(
        ScriptingPrimitives.ifTrue_,
        ScriptingMessage.withOneArg(ScriptingPrimitives.block, "failure")
      )
    ]);
    const scriptThrows = Script.fromChunks([
      "string",
      ScriptingMessage.withOneArg(
        ScriptingPrimitives.ifTrue_,
        ScriptingMessage.withOneArg(ScriptingPrimitives.block, "failure")
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
        ScriptingMessage.withOneArg(ScriptingPrimitives.block, "failure")
      )
    ]);
    const scriptFalseIfFalse = Script.fromChunks([
      false,
      ScriptingMessage.withOneArg(
        ScriptingPrimitives.ifFalse_,
        ScriptingMessage.withOneArg(ScriptingPrimitives.block, "success")
      )
    ]);
    const scriptThrows = Script.fromChunks([
      "string",
      ScriptingMessage.withOneArg(
        ScriptingPrimitives.ifFalse_,
        ScriptingMessage.withOneArg(ScriptingPrimitives.block, "failure")
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
          ScriptingMessage.withOneArg(ScriptingPrimitives.block, "success"),
          ScriptingMessage.withOneArg(ScriptingPrimitives.block, "failure")
        ])
      )
    ]);
    const scriptFalse = Script.fromChunks([
      false,
      ScriptingMessage.from(
        ScriptingPrimitives.ifTrue_ifFalse_,
        Script.fromChunks([
          ScriptingMessage.withOneArg(ScriptingPrimitives.block, "failure"),
          ScriptingMessage.withOneArg(ScriptingPrimitives.block, "success")
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

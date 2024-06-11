import assert from "node:assert";
import test from "node:test";
import {
  IScript,
  ScriptingEngine,
  ScriptingPrimitives,
  stringifyPrimative
} from "./Scripting";

test.describe("Scripting", () => {
  test(stringifyPrimative(ScriptingPrimitives.ifTrue_), () => {
    const scriptTrueIfTrue: IScript = [
      true,
      {
        p: ScriptingPrimitives.ifTrue_,
        s: [
          {
            p: ScriptingPrimitives.block,
            s: ["success"]
          }
        ]
      }
    ];
    const scriptFalseIfTrue: IScript = [
      false,
      {
        p: ScriptingPrimitives.ifTrue_,
        s: [
          {
            p: ScriptingPrimitives.block,
            s: ["failure"]
          }
        ]
      }
    ];
    const scriptThrows: IScript = [
      "string",
      {
        p: ScriptingPrimitives.ifTrue_,
        s: [
          {
            p: ScriptingPrimitives.block,
            s: ["failure"]
          }
        ]
      }
    ];

    const engine = new ScriptingEngine();
    const resultTrueIfTrue = engine.execute(scriptTrueIfTrue);
    const resultFalseIfTrue = engine.execute(scriptFalseIfTrue);
    assert.equal(resultTrueIfTrue, "success");
    assert.equal(resultFalseIfTrue, undefined);
    assert.throws(() => engine.execute(scriptThrows));
  });

  test(stringifyPrimative(ScriptingPrimitives.ifFalse_), () => {
    const scriptTrueIfFalse: IScript = [
      true,
      {
        p: ScriptingPrimitives.ifFalse_,
        s: [
          {
            p: ScriptingPrimitives.block,
            s: ["failure"]
          }
        ]
      }
    ];
    const scriptFalseIfFalse: IScript = [
      false,
      {
        p: ScriptingPrimitives.ifFalse_,
        s: [
          {
            p: ScriptingPrimitives.block,
            s: ["success"]
          }
        ]
      }
    ];
    const scriptThrows: IScript = [
      "string",
      {
        p: ScriptingPrimitives.ifFalse_,
        s: [
          {
            p: ScriptingPrimitives.block,
            s: ["failure"]
          }
        ]
      }
    ];

    const engine = new ScriptingEngine();
    const resultTrueIfFalse = engine.execute(scriptTrueIfFalse);
    const resultFalseIfFalse = engine.execute(scriptFalseIfFalse);
    assert.equal(resultTrueIfFalse, undefined);
    assert.equal(resultFalseIfFalse, "success");
    assert.throws(() => engine.execute(scriptThrows));
  });
});

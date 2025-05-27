import assert from "node:assert";
import test from "node:test";
import {SystemManager} from "../System";
import {EditorSystem} from "./EditorSystem";
import {EditorCommand} from "../editor_commands";
import {State} from "../state";

function PushIdCommand(arr: number[], id: number): EditorCommand<any, any> {
  return {
    id,
    type: "PushId",
    state: null,
    data: {},
    execute: async function() {
      arr.push(this.id);
    },
    get undoCommand() {
      return SpliceIdCommand(arr, this.id);
    }
  };
}

function SpliceIdCommand(arr: number[], id: number): EditorCommand<any, any> {
  return {
    id,
    type: "SpliceId",
    state: null,
    data: {},
    execute: async function() {
      const index = arr.indexOf(this.id);
      if (index > -1) {
        arr.splice(index, 1);
      }
    },
    get undoCommand() {
      return PushIdCommand(arr, this.id);
    }
  };
}

function TestAsyncCommand(id: number, promise: Promise<void>): EditorCommand<any, any> {
  return {
    id,
    type: "TestAsync",
    state: null,
    data: {},
    execute: async function() {
      return promise;
    },
    get undoCommand() {
      return TestAsyncCommand(this.id, Promise.resolve());
    }
  };
}

test.describe("EditorSystem command queue", async () => {
  test("order of execution", () => {
    const state = new State();
    const mgr = new SystemManager(state);
    const system = new EditorSystem(mgr);
    const order = [] as number[];
    const cmds = [
      PushIdCommand(order, 1),
      PushIdCommand(order, 2),
      PushIdCommand(order, 3),
    ];

    system.start(state);
    for (const cmd of cmds) {
      EditorSystem.addCommand(state, cmd);
    }
    system.update(state);

    assert.deepEqual(order, [1, 2, 3], "Commands should be executed in the order they were added");
  });

  await test("undo", async () => {
    const state = new State();
    const mgr = new SystemManager(state);
    const system = new EditorSystem(mgr);
    const order = [] as number[];
    const commands = [
      PushIdCommand(order, 1),
      PushIdCommand(order, 2),
      PushIdCommand(order, 3),
      TestAsyncCommand(4, Promise.reject(new Error("Test error"))),
    ];

    system.start(state);
    commands.forEach(cmd => EditorSystem.addCommand(state, cmd));
    system.update(state);
    await new Promise(resolve => setTimeout(resolve, 0));
    EditorSystem.undo(state);

    assert.deepEqual(order, [1, 2], "Undo should remove the last successful command");
  });

});

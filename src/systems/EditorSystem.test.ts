import assert from "node:assert";
import test from "node:test";
import {ActionsMixin, EditorMixin, EntityManagerMixin, LoadingStateMixin, MetaMixin, PrefabEntityMixin, QueryMixin, RouterMixin} from "../state";
import {SystemManager} from "../System";
import {EditorSystem} from "./EditorSystem";
import {composeMixins} from "../Mixins";
import {EditorCommand, EditorCommandStatus} from "../editor_commands";

const State = composeMixins(EditorMixin, QueryMixin, MetaMixin, EntityManagerMixin, LoadingStateMixin, PrefabEntityMixin, RouterMixin, ActionsMixin);

const order = [] as number[];

function TestOrderCommand(id: number): EditorCommand<any, any> {
  return {
    id,
    state: null,
    data: {},
    status: EditorCommandStatus.Pending,
    execute: async function() {
      order.push(this.id);
    },
    undo: async function() {}
  };
}

function TestAsyncCommand(id: number, promise: Promise<void>): EditorCommand<any, any> {
  return {
    id,
    state: null,
    data: {},
    status: EditorCommandStatus.Pending,
    execute: async function() {
      return promise;
    },
    undo: async function() {
    }
  };
}

test.describe("EditorSystem command queue", async () => {
  test("order of execution", () => {
    const state = new State();
    const mgr = new SystemManager(state);
    const system = new EditorSystem(mgr);

    system.start(state);
    EditorSystem.addCommand(state, TestOrderCommand(1));
    EditorSystem.addCommand(state, TestOrderCommand(2));
    EditorSystem.addCommand(state, TestOrderCommand(3));
    system.update(state);

    assert.deepEqual(order, [1, 2, 3], "Commands should be executed in the order they were added");
  });

  await test("command history", async () => {
    const state = new State();
    const mgr = new SystemManager(state);
    const system = new EditorSystem(mgr);
    const {commandHistory} = state.editor;
    const promises = [
      new Promise<void>((resolve) => setTimeout(() => resolve(), 100)),
      Promise.resolve(),
      Promise.reject(new Error("Test error")),
    ];
    system.start(state);

    for (const [i, promise] of promises.entries()) {
      EditorSystem.addCommand(state, TestAsyncCommand(i + 1, promise));
    }

    system.update(state);

    await Promise.all(promises.map(p => p.catch(() => {})));

    assert.equal(commandHistory.length, 3, "Command history should contain two commands");

    assert.deepEqual(commandHistory.map(cmd => cmd.id), [1, 2, 3], "Command history should match executed commands");

    assert.deepEqual(commandHistory.map((cmd) => cmd.status), [EditorCommandStatus.Completed, EditorCommandStatus.Completed, EditorCommandStatus.Failed], "All commands should be completed or failed");
  });

});

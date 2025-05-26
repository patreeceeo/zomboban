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
      return true;
    },
    undo: async function() {
      return true;
    }
  };
}

test("EditorSystem command queue", () => {
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

import {ServerIdComponent} from "./components";
import { State } from "./state";

export interface EditorCommand<State, Data> {
  type: string,
  id: number;
  state: State;
  data: Data;
  execute(): Promise<void>;
  undoCommand: EditorCommand<State, Data>;
}

let _id = 0;
function nextId() {
  return _id++;
}

function PostEntity(state: State, entity: any): EditorCommand<State, {entity: any}> {
  return {
    type: "PostEntity",
    id: nextId(),
    state,
    data: { entity },
    async execute() {
      const { state, data: {entity} } = this;

      // Add in case we're undoing a delete
      state.world.addEntity(entity);
      try {
        await state.client.postEntity(entity);
      } catch (error) {
        state.world.removeEntity(entity);
        throw error;
      }
    },
    get undoCommand () {
      return DeleteEntity(state, entity)
    }
  };
}

function DeleteEntity(state: State, entity: any): EditorCommand<State, {entity: any}> {
  return {
    type: "DeleteEntity",
    id: nextId(),
    state,
    data: { entity },
    async execute() {
      const { state, data: { entity } } = this;
      if (ServerIdComponent.has(entity)) {
        await state.client.deleteEntity(entity);
      }
      state.world.removeEntity(entity);
    },
    get undoCommand () {
      return PostEntity(state, entity)
    }
  };
}

export const EditorCommand = {
  PostEntity,
  DeleteEntity,
}

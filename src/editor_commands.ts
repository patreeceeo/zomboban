import {CanDeleteTag, ServerIdComponent} from "./components";
import {ClientState, EntityManagerState} from "./state";

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

function PostEntity(state: ClientState & EntityManagerState, entity: any): EditorCommand<ClientState & EntityManagerState, {entity: any}> {
  return {
    type: "PostEntity",
    id: nextId(),
    state,
    data: { entity },
    async execute() {
      const { state, data: {entity} } = this;

      // Add in case we're undoing a delete
      CanDeleteTag.remove(entity);
      state.addEntity(entity);
      try {
        await state.client.postEntity(entity);
      } catch (error) {
        state.removeEntity(entity);
        throw error;
      }
    },
    get undoCommand () {
      return DeleteEntity(state, entity)
    }
  };
}

function DeleteEntity(state: ClientState & EntityManagerState, entity: any): EditorCommand<ClientState & EntityManagerState, {entity: any}> {
  return {
    type: "DeleteEntity",
    id: nextId(),
    state,
    data: { entity },
    async execute() {
      const { state, data: { entity } } = this;
      CanDeleteTag.add(entity);
      if (ServerIdComponent.has(entity)) {
        await state.client.deleteEntity(entity);
      }
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

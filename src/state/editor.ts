import {EditorCommand} from "../editor_commands";

export class EditorState {
  commandQueue: EditorCommand<any, any>[] = [];
  undoStack: EditorCommand<any, any>[] = [];
  redoStack: EditorCommand<any, any>[] = [];
}

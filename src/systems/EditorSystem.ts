import { IObservableSubscription } from "../Observable";
import { SystemWithQueries } from "../System";
import { IsActiveTag, IsGameEntityTag } from "../components";
import { EditorCursorState, QueryState } from "../state";

type State = EditorCursorState & QueryState;

export class EditorSystem extends SystemWithQueries<State> {
  #gameEnts = this.createQuery([IsGameEntityTag]);
  #subscriptions = [] as IObservableSubscription[];
  start(state: State) {
    IsActiveTag.add(state.editorCursor);
    state.editorCursor.visible = true;
    this.#subscriptions.push(
      this.#gameEnts.stream((ent) => {
        IsActiveTag.remove(ent);
      })
    );
  }
  stop(state: State) {
    IsActiveTag.remove(state.editorCursor);
    state.editorCursor.visible = false;
    for (const sub of this.#subscriptions) {
      sub.unsubscribe();
    }
  }
}

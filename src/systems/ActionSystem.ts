import { SystemWithQueries } from "../System";
import {
  EntityWithComponents,
} from "../Component";
import { BehaviorComponent } from "../components";
import { State } from "../state";
import {Action} from "../Action";
import {IQueryPredicate} from "../Query";


export type ActionEntity<Components extends IQueryPredicate<any>> =
  EntityWithComponents<Components | typeof BehaviorComponent>;

export class ActionSystem extends SystemWithQueries<State> {
  behaviorQuery = this.createQuery([BehaviorComponent]);
  static updateAction(action: Action<ActionEntity<typeof BehaviorComponent>, State>, state: State) {
    action.seek(state.time.frameDelta);
    action.update(state);
  }
  start(state: State) {
    this.resources.push(
      this.behaviorQuery.onRemove((entity) => {
        state.pendingActions.filterInPlace((action) => {
          return action.entity !== entity;
        });
      }),
      // TODO It's a little weird to handle onStart this way, since onComplete is not, but this is the best grug developer could think.
      // How to have ActionSystem be responsible for Actions while not calling onStart more than once?
      // This is the question grug brain struggling with.
      state.pendingActions.onAdd((action) => {
        action.onStart(state);
      }),
      state.pendingActions.onRemove((action) => {
        // Though you might expect this be performed by Action.onComplete, actions can be removed
        // without being completed, such as in ActionSystem.stop.
        action.entity.actions.delete(action);
      })
    );
  }
  update(state: State) {
    if (state.time.isPaused) return; // EARLY RETURN!

    // state.shouldRerender ||=
    //   state.pendingActions.length > 0;
    // No longer assuming that all changes that effect the scene happen through actions.

    const { pendingActions } = state;
    if (pendingActions.length > 0) {
      state.time.time += state.time.frameDelta;
      state.isAtStart = false;
    }

    for (const action of pendingActions) {
      ActionSystem.updateAction(action, state);
    }

    pendingActions.filterInPlace((action) => {
      const actionInProgress = action.progress < 1;
      if (!actionInProgress) {
        // Add changed tag so the tile position is updated
        // console.log("adding changed tag because of", action.toString());
        action.onComplete(state);
      }
      return actionInProgress;
    });
  }
  stop(state: State) {
    state.pendingActions.length = 0;
  }
}

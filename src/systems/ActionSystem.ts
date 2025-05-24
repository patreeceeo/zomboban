import { SystemWithQueries } from "../System";
import {
  EntityWithComponents,
  IReadonlyComponentDefinition
} from "../Component";
import { BehaviorComponent, ChangedTag } from "../components";
import {
  ActionsState,
  EntityManagerState,
  QueryState,
  RendererState,
  TimeState
} from "../state";

type State = ActionsState &
  TimeState &
  EntityManagerState &
  QueryState &
  RendererState;

export type ActionEntity<Components extends IReadonlyComponentDefinition<any>> =
  EntityWithComponents<Components | typeof BehaviorComponent>;

export class ActionSystem extends SystemWithQueries<State> {
  behaviorQuery = this.createQuery([BehaviorComponent]);
  changedQuery = this.createQuery([ChangedTag]);
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
    if (state.isPaused) return; // EARLY RETURN!

    for (const entity of this.changedQuery) {
      ChangedTag.remove(entity);
    }

    // state.shouldRerender ||=
    //   state.pendingActions.length > 0;
    // No longer assuming that all changes that effect the scene happen through actions.
    state.shouldRerender = true;

    const { pendingActions } = state;
    if (pendingActions.length > 0) {
      state.time += state.dt;
      state.isAtStart = false;
    }

    for (const action of pendingActions) {
      action.seek(state.dt);
      action.update(state);
    }

    pendingActions.filterInPlace((action) => {
      const actionInProgress = action.progress < 1;
      if (!actionInProgress) {
        // Add changed tag so the tile position is updated
        // console.log("adding changed tag because of", action.toString());
        ChangedTag.add(action.entity);
        action.onComplete(state);
      }
      return actionInProgress;
    });
  }
  stop(state: State) {
    state.pendingActions.length = 0;
  }
}

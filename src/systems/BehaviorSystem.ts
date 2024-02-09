import { Query } from "../Query";
import { Behavior } from "../components/Behavior";
import { state } from "../state";

const BehaviorQuery = Query.build("Behavior").complete(({ entityId }) => {
  return (
    state.hasBehavior(entityId) &&
    typeof state.getBehavior(entityId) === "object"
  );
});

const RemovingQuery = Query.build("RemovingQuery").complete(({ entityId }) => {
  return state.isEntityRemovedThisFrame(entityId);
});

const NotRemovingQuery = Query.build("RemovingQuery").complete(
  ({ entityId }) => {
    return !state.isEntityRemovedThisFrame(entityId);
  },
);

export function BehaviorSystem(deltaTime: number, elapsedTime: number) {
  const entities = BehaviorQuery(state.addedEntities);
  for (const entityId of RemovingQuery(entities)) {
    const behavior = state.getBehavior(entityId) as Behavior;
    behavior.stop();
  }

  for (const entityId of NotRemovingQuery(entities)) {
    const behavior = state.getBehavior(entityId) as Behavior;
    if (!behavior.isStarted) {
      behavior.start();
    }
    behavior.onFrame(deltaTime, elapsedTime);
  }
}

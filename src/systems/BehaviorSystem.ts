import { EntityFrameOperationComponent } from "../components";
import { Behavior, BehaviorComponent } from "../components/Behavior";
import { EntityFrameOperation } from "../components/EntityFrameOperation";
import { state } from "../state";

const RemovingQuery = state
  .buildQuery([BehaviorComponent, EntityFrameOperationComponent])
  .complete(({ entityId }) => {
    return state.is(
      EntityFrameOperationComponent,
      entityId,
      EntityFrameOperation.REMOVE,
    );
  });

const NotRemovingQuery = state
  .buildQuery([BehaviorComponent])
  .complete(({ entityId }) => {
    return (
      typeof state.get(BehaviorComponent, entityId) === "object" &&
      !state.is(
        EntityFrameOperationComponent,
        entityId,
        EntityFrameOperation.REMOVE,
      )
    );
  });

export function BehaviorSystem(deltaTime: number, elapsedTime: number) {
  for (const entityId of RemovingQuery()) {
    const behavior = state.get(BehaviorComponent, entityId) as Behavior;
    behavior.stop();
  }

  for (const entityId of NotRemovingQuery()) {
    const behavior = state.get(BehaviorComponent, entityId) as Behavior;
    if (!behavior.isStarted) {
      behavior.start();
    }
    behavior.onFrame(deltaTime, elapsedTime);
  }
}

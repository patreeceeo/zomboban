import { EntityFrameOperationComponent } from "../components";
import { Behavior, BehaviorComponent } from "../components/Behavior";
import { EntityFrameOperation } from "../components/EntityFrameOperation";
import { stateOld } from "../state";

const RemovingQuery = stateOld
  .buildQuery({ all: [BehaviorComponent, EntityFrameOperationComponent] })
  .complete(({ entityId }) => {
    return (
      stateOld.has(EntityFrameOperationComponent, entityId) &&
      stateOld.is(
        EntityFrameOperationComponent,
        entityId,
        EntityFrameOperation.REMOVE
      )
    );
  });

const NotRemovingQuery = stateOld
  .buildQuery({ all: [BehaviorComponent] })
  .complete(({ entityId }) => {
    return (
      typeof stateOld.get(BehaviorComponent, entityId) === "object" &&
      !(
        stateOld.has(EntityFrameOperationComponent, entityId) &&
        stateOld.is(
          EntityFrameOperationComponent,
          entityId,
          EntityFrameOperation.REMOVE
        )
      )
    );
  });

export function BehaviorSystem(deltaTime: number, elapsedTime: number) {
  for (const entityId of RemovingQuery()) {
    const behavior = stateOld.get(BehaviorComponent, entityId) as Behavior;
    behavior.stop();
  }

  for (const entityId of NotRemovingQuery()) {
    const behavior = stateOld.get(BehaviorComponent, entityId) as Behavior;
    if (!behavior.isStarted) {
      behavior.start();
    }
    behavior.onFrame(deltaTime, elapsedTime);
  }
}

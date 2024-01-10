import { EntityName, getNamedEntity } from "../Entity";
import { EventType, Event, dispatchEvent } from "../Event";
import {
  Action,
  enqueueAction,
  createUndoPoint,
  pushUndoPoint,
  popUndoPoint,
} from "../systems/ActionSystem";
import { getCameraViewRectangle } from "./Camera";

export function tryAction(
  action: Action,
  shouldPushNewUndoPoint: boolean,
): boolean {
  const beforeActionEvent = new Event(
    EventType.TEST_ACTION,
    action,
    action.effectedArea,
  );

  if (shouldPushNewUndoPoint) {
    pushUndoPoint(createUndoPoint());
  }

  dispatchEvent(beforeActionEvent);

  if (!beforeActionEvent.isCancelled) {
    const cameraViewRectangle = getCameraViewRectangle(
      getNamedEntity(EntityName.CAMERA),
    );
    const onActionEvent = new Event(
      EventType.START_ACTION,
      action,
      cameraViewRectangle,
    );

    enqueueAction(action);

    dispatchEvent(onActionEvent);

    return true;
  } else if (shouldPushNewUndoPoint) {
    popUndoPoint();
  }

  return false;
}

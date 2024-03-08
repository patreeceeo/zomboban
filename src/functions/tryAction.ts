import { EventType, Event, dispatchEvent } from "../Event";
import {
  ActionOld,
  enqueueActionOld,
  createUndoPointOld,
  pushUndoPointOld,
  popUndoPointOld
} from "../systems/ActionSystem";
import { getCameraViewRectangle } from "./Camera";

export function tryAction(
  action: ActionOld,
  shouldPushNewUndoPoint: boolean
): boolean {
  const beforeActionEvent = new Event(
    EventType.TEST_ACTION,
    action,
    action.effectedArea
  );

  if (shouldPushNewUndoPoint) {
    pushUndoPointOld(createUndoPointOld());
  }

  dispatchEvent(beforeActionEvent);

  if (!beforeActionEvent.isCancelled) {
    const cameraViewRectangle = getCameraViewRectangle();
    const onActionEvent = new Event(
      EventType.START_ACTION,
      action,
      cameraViewRectangle
    );

    enqueueActionOld(action);

    dispatchEvent(onActionEvent);

    return true;
  } else if (shouldPushNewUndoPoint) {
    popUndoPointOld();
  }

  return false;
}

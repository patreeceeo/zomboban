import { System } from "../System";
import { ActionsState } from "../state";
import {
  UIBuiltIn,
  UIElementArray,
  UIElementArrayOptions,
  removeElementByIdSafely
} from "../UIElement";
import { ActionEntity } from "./ActionSystem";
import { Action } from "../Action";

const UIAction = (data: Action<ActionEntity<any>, any>) => {
  return UIBuiltIn.TR({
    className: "",
    children() {
      return [
        UIBuiltIn.TD({
          className: "",
          children() {
            return [data.toString()];
          }
        }),
        UIBuiltIn.TD({
          className: "paddingLeft1",
          children() {
            return [data.entity.behaviorId];
          }
        })
      ];
    }
  });
};

declare const pendingActionsElement: HTMLElement;
declare const undoingActionsElement: HTMLElement;
declare const completedActionsElement: HTMLElement;
declare const showActionViz: HTMLInputElement;
class _ActionDebugSystem extends System<ActionsState> {
  #pendingActions = new UIElementArray(
    pendingActionsElement,
    UIAction,
    new UIElementArrayOptions(Infinity, true)
  );
  #undoingActions = new UIElementArray(
    undoingActionsElement,
    UIAction,
    new UIElementArrayOptions(Infinity, true)
  );
  #completedActions = new UIElementArray(
    completedActionsElement,
    UIAction,
    new UIElementArrayOptions(20, true)
  );
  update() {
    const enabled = showActionViz.checked;
    if (enabled) {
      pendingActionsElement.style.display = "initial";
      undoingActionsElement.style.display = "initial";
      completedActionsElement.style.display = "initial";
    } else {
      pendingActionsElement.style.display = "none";
      undoingActionsElement.style.display = "none";
      completedActionsElement.style.display = "none";
    }
  }
  start(state: ActionsState) {
    this.#pendingActions.subscribe(state.pendingActions);
    this.#undoingActions.subscribe(state.undoingActions);
    this.#completedActions.subscribe(state.completedActions);
    this.update();

    showActionViz.onchange = () => {
      this.update();
    };
  }
  stop() {
    this.#pendingActions.unsubscribe();
    this.#undoingActions.unsubscribe();
    this.#completedActions.unsubscribe();
  }
}

class HideAndExit extends System<any> {
  start(): void {
    removeElementByIdSafely("actionVizDiv");
    this.mgr.remove(HideAndExit);
  }
}

export const ActionDebugSystem =
  process.env.NODE_ENV === "production" ? HideAndExit : _ActionDebugSystem;

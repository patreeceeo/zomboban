import { System } from "../System";
import { ActionsState } from "../state";
import { NativeUIElement, UIElementArray } from "../UIElement";
import { Action, ActionEntity } from "./ActionSystem";

const UIAction = (data: Action<ActionEntity<any>, any>) => {
  return NativeUIElement({
    tagName: "TR",
    className: "",
    children() {
      return [
        NativeUIElement({
          tagName: "TD",
          className: "",
          children() {
            return [data.toString()];
          }
        }),
        NativeUIElement({
          tagName: "TD",
          className: "paddingLeft1",
          children() {
            return [data.entity.behaviorId];
          }
        })
      ];
    }
  });
};

const UIActionRound = (data: Action<ActionEntity<any>, any>[]) => {
  return NativeUIElement({
    tagName: "TABLE",
    className: "borderWhite",
    children() {
      return data.map(UIAction);
    }
  });
};

declare const pendingActionsElement: HTMLElement;
declare const completedActionsElement: HTMLElement;
export class ActionDebugSystem extends System<ActionsState> {
  #pendingActions = new UIElementArray(pendingActionsElement, UIAction, 5);
  #completedActions = new UIElementArray(
    completedActionsElement,
    UIActionRound,
    5
  );
  start(state: ActionsState) {
    this.#pendingActions.subscribe(state.pendingActions);
    this.#completedActions.subscribe(state.completedActions);
  }
}

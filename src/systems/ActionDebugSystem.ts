import { System } from "../System";
import { ActionsState } from "../state";
import { UIBuiltIn, UIElementArray, UIElementArrayOptions } from "../UIElement";
import { Action, ActionEntity } from "./ActionSystem";

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

const UIActionRound = (data: Action<ActionEntity<any>, any>[]) => {
  return UIBuiltIn.TABLE({
    className: "borderWhite",
    children() {
      return data.map(UIAction);
    }
  });
};

declare const pendingActionsElement: HTMLElement;
declare const undoingActionsElement: HTMLElement;
declare const completedActionsElement: HTMLElement;
const actionListOptions = new UIElementArrayOptions(5);
export class ActionDebugSystem extends System<ActionsState> {
  #pendingActions = new UIElementArray(
    pendingActionsElement,
    UIAction,
    actionListOptions
  );
  #undoingActions = new UIElementArray(
    undoingActionsElement,
    UIAction,
    actionListOptions
  );
  #completedActions = new UIElementArray(
    completedActionsElement,
    UIActionRound,
    new UIElementArrayOptions(5, true)
  );
  start(state: ActionsState) {
    this.#pendingActions.subscribe(state.pendingActions);
    this.#undoingActions.subscribe(state.undoingActions);
    this.#completedActions.subscribe(state.completedActions);
  }
}

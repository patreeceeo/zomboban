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
declare const showActionViz: HTMLInputElement;
export class ActionDebugSystem extends System<ActionsState> {
  #pendingActions = new UIElementArray(pendingActionsElement, UIAction);
  #undoingActions = new UIElementArray(undoingActionsElement, UIAction);
  #completedActions = new UIElementArray(
    completedActionsElement,
    UIActionRound,
    new UIElementArrayOptions(5, true)
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

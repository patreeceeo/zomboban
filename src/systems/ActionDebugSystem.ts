import { System } from "../System";
import { ActionsState } from "../state";
import {
  NativeUIElement,
  UIElementArray,
  UIElementArrayProps
} from "../UIElement";
import { Action, ActionEntity } from "./ActionSystem";

declare const actionLogElement: HTMLElement;

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

export class ActionDebugSystem extends System<ActionsState> {
  #uiArray = new UIElementArray(new UIElementArrayProps("table", UIAction));
  start(state: ActionsState) {
    this.#uiArray.subscribe(state.pendingActions);
    actionLogElement.appendChild(this.#uiArray.render());
  }
}

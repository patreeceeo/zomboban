import {
  BoxBehavior,
  BroBehavior,
  PlayerBehavior,
  WallBehavior,
  AirplaneBehavior,
  CursorBehavior,
} from "../behaviors";
import { BehaviorComponent } from "../components";
import { state } from "../state";

const behaviors = [
  BoxBehavior,
  BroBehavior,
  PlayerBehavior,
  WallBehavior,
  AirplaneBehavior,
  CursorBehavior,
];

export function registerBehaviorTypes() {
  const component = state.getComponent(BehaviorComponent);
  for (const b of behaviors) {
    component.registerType(b);
  }
}

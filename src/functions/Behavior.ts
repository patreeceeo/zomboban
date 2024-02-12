import {
  BoxBehavior,
  BroBehavior,
  PlayerBehavior,
  WallBehavior,
  AirplaneBehavior,
  CursorBehavior,
} from "../behaviors";
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
  for (const b of behaviors) {
    state.registerBehaviorType(b);
  }
}

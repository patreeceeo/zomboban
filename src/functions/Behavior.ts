import {
  BoxBehavior,
  BroBehavior,
  PlayerBehavior,
  WallBehavior,
  AirplaneBehavior,
  CursorBehavior,
} from "../behaviors";
import { mutState } from "../state";

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
    mutState.registerBehaviorType(b);
  }
}

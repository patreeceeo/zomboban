import {
  BoxBehavior,
  BroBehavior,
  PlayerBehavior,
  WallBehavior,
  AirplaneBehavior,
  CursorBehavior,
} from "../behaviors";
import { registerBehaviorType } from "../components/Behavior";

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
    registerBehaviorType(b);
  }
}

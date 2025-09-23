import { Vector2 } from "three";
import { KeyCombo } from "../Input";
import { KeyMapping } from "../systems/InputSystem";
import { HeadingDirectionValue } from "../HeadingDirection";

const DEAD_ZONE_THRESHOLD = 20; // pixels

export class InputState {
  #keys: KeyCombo[] = [];

  get keys() {
    return this.#keys;
  }

  pressed = 0 as KeyCombo;
  pointerPosition = new Vector2();
  keyMapping = new KeyMapping();

  // Touch tracking properties
  touchStartPosition: Vector2 | null = null;
  currentTouchDirection: HeadingDirectionValue = HeadingDirectionValue.None;
  isTouching: boolean = false;
  isInTouchDeadZone: boolean = true;

  static get DEAD_ZONE_THRESHOLD() {
    return DEAD_ZONE_THRESHOLD;
  }
}

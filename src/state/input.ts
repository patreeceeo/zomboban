import { Vector2 } from "three";
import { KeyCombo } from "../Input";
import { KeyMapping } from "../systems/InputSystem";

// Forward declaration to avoid circular import
interface State {
  [key: string]: any;
}

export class InputState {
  #keys: KeyCombo[] = [];
  
  get keys() {
    return this.#keys;
  }
  
  pressed = 0 as KeyCombo;
  pointerPosition = new Vector2();
  keyMapping = new KeyMapping<State>();
}

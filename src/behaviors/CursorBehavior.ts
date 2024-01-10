// import { Key, createInputQueue, isKeyRepeating } from "../Input";
import { ActLike, Behavior } from "../components/ActLike";
// import { setPosition } from "../components/Position";
// import { getPositionX } from "../components/PositionX";
// import { getPositionY } from "../components/PositionY";
// import {
//   INITIAL_INPUT_THROTTLE,
//   MOVEMENT_KEY_MAPS,
//   REPEAT_INPUT_THROTTLE,
// } from "../constants";
// import { followEntityWithCamera } from "../systems/CameraSystem";
// import { convertTxpsToPps, convertTypsToPps } from "../units/convert";
// import { throttle } from "../util";
//
// TODO

export class CursorBehavior implements Behavior {
  readonly type = ActLike.CURSOR;
  // readonly inputQueue = createInputQueue();
  constructor(readonly entityId: number) {}

  initializeWithComponents(): void {}

  destroy(): void {}

  toString() {
    return "CURSOR";
  }

  onFrame() {
    // const cursorId = this.entityId;
    // const { inputQueue } = this;
    // const input = inputQueue.shift();
    // followEntityWithCamera(cursorId);
    // if (input === undefined) {
    //   this.handleInputInitial.cancel();
    // } else {
    //   isKeyRepeating(input)
    //     ? this.handleInputRepeat(input as Key)
    //     : this.handleInputInitial(input as Key);
    // }
  }

  // handleInput = (input: Key) => {
  //   const cursorId = this.entityId;
  //   if (input in MOVEMENT_KEY_MAPS) {
  //     const [dx, dy] = MOVEMENT_KEY_MAPS[input]!;
  //     const x = getPositionX(cursorId);
  //     const y = getPositionY(cursorId);
  //     setPosition(
  //       cursorId,
  //       (x + convertTxpsToPps(dx)) as Px,
  //       (y + convertTypsToPps(dy)) as Px
  //     );
  //   }
  // };

  // handleInputInitial = throttle(this.handleInput, INITIAL_INPUT_THROTTLE);
  // handleInputRepeat = throttle(this.handleInput, REPEAT_INPUT_THROTTLE);
}

import {
  IMessageReceiver,
  IMessageSender,
  Message,
  defineMessage
} from "./Message";

/** Ask an actor if it can move from its current position to its position plus `delta`. */
export const MoveIntoMessage = defineMessage(
  class MoveIntoMessage extends Message<boolean> {
    static type = "MoveInto";
    answer = true;
    constructor(receiver: IMessageReceiver, sender: IMessageSender) {
      super(receiver, sender);
    }
  }
);

export const MoveIntoTerminalMessage = defineMessage(
  class MoveIntoTerminal extends Message<boolean> {
    static type = "MoveIntoTerminal";
    answer = false;
  }
);

export const ToggleMessage = defineMessage(
  class ToggleMessage extends Message<void> {
    static type = "toggle";
  }
);

export const WinMessage = defineMessage(
  class WinMessage extends Message<void> {
    static type = "win";
  }
);

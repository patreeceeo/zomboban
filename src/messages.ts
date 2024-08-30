import { Message, defineMessage } from "./Message";

/** Ask an actor if it can move from its current position to its position plus `delta`. */
export const MoveIntoMessage = defineMessage(
  class MoveIntoMessage extends Message<boolean> {
    static type = "MoveInto";
  }
);

export const MoveIntoWallMessage = defineMessage(
  class MoveIntoWall extends Message<boolean> {
    static type = "MoveIntoWall";
  }
);

export const MoveIntoWallPlaceholderMessage = defineMessage(
  class MoveIntoWall extends Message<boolean> {
    static type = "MoveIntoWallPlaceholder";
  }
);

export const MoveIntoBlockMessage = defineMessage(
  class MoveIntoBlock extends Message<boolean> {
    static type = "MoveIntoBlock";
  }
);

export const MoveIntoGolemMessage = defineMessage(
  class MoveIntoWall extends Message<boolean> {
    static type = "MoveIntoGolem";
  }
);

export const MoveIntoPlayerMessage = defineMessage(
  class MoveIntoWall extends Message<boolean> {
    static type = "MoveIntoPlayer";
  }
);

export const MoveIntoTerminalMessage = defineMessage(
  class MoveIntoTerminal extends Message<boolean> {
    static type = "MoveIntoTerminal";
  }
);

export const MoveIntoGrassMessage = defineMessage(
  class MoveIntoGrass extends Message<boolean> {
    static type = "MoveIntoGrass";
  }
);

export const HitByGolemMessage = defineMessage(
  class RemoveMessage extends Message<void> {
    static type = "HitByGolem";
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

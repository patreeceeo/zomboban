import { Message } from "./Message";
import { some } from "lodash";

export namespace MoveMessage {
  export enum Response {
    Allowed = 0,
    Blocked = 1
  }

  export function reduceResponses(responses: Iterable<Response | undefined>) {
    if (some(responses)) {
      return Response.Blocked;
    } else {
      return Response.Allowed;
    }
  }

  export class Into extends Message<Response> {
    static type = "MoveInto";
  }

  export class IntoWall extends Message<Response> {
    static type = "MoveIntoWall";
  }

  export class IntoWallPlaceholder extends Message<Response> {
    static type = "MoveIntoWallPlaceholder";
  }

  export class IntoBlock extends Message<Response> {
    static type = "MoveIntoBlock";
  }

  export class IntoGolem extends Message<Response> {
    static type = "MoveIntoGolem";
  }

  export class IntoPlayer extends Message<Response> {
    static type = "MoveIntoPlayer";
  }

  export class IntoTerminal extends Message<Response> {
    static type = "MoveIntoTerminal";
  }

  export class IntoGrass extends Message<Response> {
    static type = "MoveIntoGrass";
  }
}

export class HitByGolemMessage extends Message<void> {
  static type = "HitByGolem";
}

export class ToggleMessage extends Message<void> {
  static type = "toggle";
}

export class WinMessage extends Message<void> {
  static type = "win";
}

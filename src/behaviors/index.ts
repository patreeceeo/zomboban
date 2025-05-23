import { Behavior } from "../systems/BehaviorSystem";

export enum BehaviorEnum {
  Block = "block",
  Cursor = "cursor",
  Fire = "fire",
  Monster = "monster",
  Player = "player",
  Terminal = "terminal",
  ToggleButton = "toggle-button",
  ToggleWall = "toggle-wall",
  Wall = "wall"
}

async function keyOfResult(p: Promise<any>, key: string) {
  return (await p)[key];
}

export async function importBehavior(
  id: BehaviorEnum
): Promise<IConstructor<Behavior<any, any>>> {
  switch (id) {
    case BehaviorEnum.Block:
      return keyOfResult(import("./BlockBehavior"), "BlockBehavior");
    case BehaviorEnum.Cursor:
      return keyOfResult(import("./CursorBehavior"), "CursorBehavior");
    case BehaviorEnum.Fire:
      return keyOfResult(import("./FireBehavior"), "FireBehavior");
    case BehaviorEnum.Monster:
      return keyOfResult(import("./MonsterBehavior"), "MonsterBehavior");
    case BehaviorEnum.Player:
      return keyOfResult(import("./PlayerBehavior"), "PlayerBehavior");
    case BehaviorEnum.Terminal:
      return keyOfResult(import("./TerminalBehavior"), "TerminalBehavior");
    case BehaviorEnum.ToggleButton:
      return keyOfResult(
        import("./ToggleButtonBehavior"),
        "ToggleButtonBehavior"
      );
    case BehaviorEnum.ToggleWall:
      return keyOfResult(import("./ToggleWallBehavior"), "ToggleWallBehavior");
    case BehaviorEnum.Wall:
      return keyOfResult(import("./WallBehavior"), "WallBehavior");
  }
}

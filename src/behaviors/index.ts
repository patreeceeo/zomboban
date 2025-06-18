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

async function getDefault(p: Promise<any>) {
  return (await p).default;
}


export async function importBehaviors() {
  return [
    [BehaviorEnum.Block, await getDefault(import("./BlockBehavior"))],
    [BehaviorEnum.Cursor, await getDefault(import("./CursorBehavior"))],
    [BehaviorEnum.Fire, await getDefault(import("./FireBehavior"))],
    [BehaviorEnum.Monster, await getDefault(import("./MonsterBehavior"))],
    [BehaviorEnum.Player, await getDefault(import("./PlayerBehavior"))],
    [BehaviorEnum.Terminal, await getDefault(import("./TerminalBehavior"))],
    [BehaviorEnum.ToggleButton, await getDefault(
      import("./ToggleButtonBehavior"),
    )],
    [BehaviorEnum.ToggleWall, await getDefault(import("./ToggleWallBehavior"))],
    [BehaviorEnum.Wall, await getDefault(import("./WallBehavior"))],
  ] as const
}

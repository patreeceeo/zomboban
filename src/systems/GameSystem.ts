import { Key, KeyMap, getLastKeyDown, isAnyKeyDown } from "../Input";
import { setPosition } from "../components/Position";
import { getPositionX } from "../components/PositionX";
import { getPositionY } from "../components/PositionY";
import { SPRITE_SIZE } from "../components/Sprite";
import { getPlayerIfExists } from "../functions/Player";
import { throttle } from "../util";

const MOVEMENT_KEY_MAPS: KeyMap<[number, number]> = {
  [Key.a]: [-1, 0],
  [Key.s]: [0, 1],
  [Key.w]: [0, -1],
  [Key.d]: [1, 0],
};

const MOVEMENT_KEYS = Object.keys(MOVEMENT_KEY_MAPS) as Key[];

function movePlayerByTiles(playerId: number, dx: number, dy: number) {
  const x = getPositionX(playerId);
  const y = getPositionY(playerId);
  setPosition(playerId, x + dx * SPRITE_SIZE, y + dy * SPRITE_SIZE);
}

const throttledMovePlayerByTiles = throttle(movePlayerByTiles, 700);

export function GameSystem() {
  const maybePlayerId = getPlayerIfExists();
  if (maybePlayerId === undefined) {
    // show gameover?
    return false;
  }
  const playerId = maybePlayerId!;
  const lastKeyDown = getLastKeyDown()!;

  if (MOVEMENT_KEYS.includes(lastKeyDown) && isAnyKeyDown(MOVEMENT_KEYS)) {
    const [dx, dy] = MOVEMENT_KEY_MAPS[lastKeyDown]!;
    throttledMovePlayerByTiles(playerId, dx, dy);
  } else {
    throttledMovePlayerByTiles.cancel();
  }

  return true;
}

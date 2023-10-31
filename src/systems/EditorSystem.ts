import { EntityName, addEntity, getNamedEntity } from "../Entity";
import { getLastKeyDown, isAnyKeyDown, isKeyDown, isKeyRepeating, isLastKeyRepeating } from "../Input";
import { and, executeFilterQuery } from "../Query";
import { ActLike, isActLike, setActLike } from "../components/ActLike";
import { isLookLike, setLookLike } from "../components/LookLike";
import { getPixiApp, setPixiApp } from "../components/PixiApp";
import { setPosition } from "../components/Position";
import { getPositionX } from "../components/PositionX";
import { getPositionY } from "../components/PositionY";
import { SPRITE_SIZE } from "../components/Sprite";
import { LeadingTrailingMask, throttle } from "../util";

if (module.hot) {
  module.hot.accept((getParents) => {
    return getParents();
  });
}

const cursorIds: number[] = [];

function getEditorCursors(): number[] {
  cursorIds.length = 0;
  return executeFilterQuery(
    and(
      (entityId) =>
        isLookLike(entityId, getNamedEntity(EntityName.EDITOR_CURSOR_IMAGE)),
      (entityId) => isActLike(entityId, ActLike.EDITOR_CURSOR)
    ),
    cursorIds
  );
}

function moveCursorByTiles(cursorId: number, dx: number, dy: number) {
  const x = getPositionX(cursorId);
  const y = getPositionY(cursorId);
  setPosition(cursorId, x + dx * SPRITE_SIZE, y + dy * SPRITE_SIZE);
}

const slowThrottledMoveCursorByTiles = throttle(
  moveCursorByTiles,
  500,
);
const fastThrottledMoveCursorByTiles = throttle(
  moveCursorByTiles,
  100,
);


export function EditorSystem() {
  const cursorIds = getEditorCursors();
  const pixiApp = getPixiApp(getNamedEntity(EntityName.DEFAULT_PIXI_APP));
  if (cursorIds.length === 0) {
    const cursorId = addEntity();
    setLookLike(cursorId, getNamedEntity(EntityName.EDITOR_CURSOR_IMAGE));
    setActLike(cursorId, ActLike.EDITOR_CURSOR);
    setPosition(cursorId, 0, 0);
    setPixiApp(cursorId, pixiApp);
  }

  for (const cursorId of cursorIds) {
    if (isKeyDown("KeyH") || isKeyDown("KeyJ") || isKeyDown("KeyK") || isKeyDown("KeyL")) {
      const lastKeyDown = getLastKeyDown()!;

      const throttledMoveCursorByTiles = isKeyRepeating(lastKeyDown) ? fastThrottledMoveCursorByTiles : slowThrottledMoveCursorByTiles;
      switch (lastKeyDown) {
        case "KeyH":
          throttledMoveCursorByTiles(cursorId, -1, 0);
          break;
        case "KeyJ":
          throttledMoveCursorByTiles(cursorId, 0, 1);
          break;
        case "KeyK":
          throttledMoveCursorByTiles(cursorId, 0, -1);
          break;
        case "KeyL":
          throttledMoveCursorByTiles(cursorId, 1, 0);
          break;
      }

    }
  }
}

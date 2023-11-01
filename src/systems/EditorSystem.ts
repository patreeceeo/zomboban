import { EntityName, addEntity, getNamedEntity } from "../Entity";
import {
  getLastKeyDown,
  isAnyKeyDown,
  isKeyRepeating,
} from "../Input";
import { executeFilterQuery } from "../Query";
import { ActLike, isActLike, setActLike } from "../components/ActLike";
import { setLookLike } from "../components/LookLike";
import { getPixiApp, setPixiApp } from "../components/PixiApp";
import { setPosition } from "../components/Position";
import { getPositionX } from "../components/PositionX";
import { getPositionY } from "../components/PositionY";
import { SPRITE_SIZE } from "../components/Sprite";
import { throttle } from "../util";

if (module.hot) {
  module.hot.accept((getParents) => {
    return getParents();
  });
}

const cursorIds: number[] = [];

enum EditorMode {
  NORMAL,
  REPLACE,
}

let editorMode = EditorMode.NORMAL;



function getEditorCursors(): number[] {
  cursorIds.length = 0;
  return executeFilterQuery((entityId) => isActLike(entityId, ActLike.EDITOR_CURSOR),
    cursorIds
  );
}

function moveCursorByTiles(cursorId: number, dx: number, dy: number) {
  const x = getPositionX(cursorId);
  const y = getPositionY(cursorId);
  setPosition(cursorId, x + dx * SPRITE_SIZE, y + dy * SPRITE_SIZE);
}

function enterNormalMode(cursorId: number) {
  editorMode = EditorMode.NORMAL;
  setLookLike(cursorId, getNamedEntity(EntityName.EDITOR_NORMAL_CURSOR_IMAGE));
}

function enterReplaceMode(cursorId: number) {
  editorMode = EditorMode.REPLACE;
  setLookLike(cursorId, getNamedEntity(EntityName.EDITOR_REPLACE_CURSOR_IMAGE));
}

const slowThrottledMoveCursorByTiles = throttle(moveCursorByTiles, 500);
const fastThrottledMoveCursorByTiles = throttle(moveCursorByTiles, 100);

const MOVEMENT_KEY_MAPS: Record<string, [number, number]> = {
  KeyH: [-1, 0],
  KeyJ: [0, 1],
  KeyK: [0, -1],
  KeyL: [1, 0],
};

const MOVEMENT_KEYS = Object.keys(MOVEMENT_KEY_MAPS);

export function EditorSystem() {
  const cursorIds = getEditorCursors();
  const pixiApp = getPixiApp(getNamedEntity(EntityName.DEFAULT_PIXI_APP));
  if (cursorIds.length === 0) {
    const cursorId = addEntity();
    setLookLike(
      cursorId,
      getNamedEntity(EntityName.EDITOR_NORMAL_CURSOR_IMAGE)
    );
    setActLike(cursorId, ActLike.EDITOR_CURSOR);
    setPosition(cursorId, 0, 0);
    setPixiApp(cursorId, pixiApp);
  }

  for (const cursorId of cursorIds) {
    const lastKeyDown = getLastKeyDown()!;
    switch (editorMode) {
      case EditorMode.NORMAL:
        if (isAnyKeyDown(MOVEMENT_KEYS)) {

          const throttledMoveCursorByTiles = isKeyRepeating(lastKeyDown)
            ? fastThrottledMoveCursorByTiles
            : slowThrottledMoveCursorByTiles;
          const [dx, dy] = MOVEMENT_KEY_MAPS[lastKeyDown];
          throttledMoveCursorByTiles(cursorId, dx, dy);
        }
        if (lastKeyDown === "KeyR") {
          enterReplaceMode(cursorId);
        }
        break;
      case EditorMode.REPLACE:
        if (lastKeyDown === "Escape" || lastKeyDown === "CapsLock") {
          enterNormalMode(cursorId);
        }
        break;
    }
  }
}

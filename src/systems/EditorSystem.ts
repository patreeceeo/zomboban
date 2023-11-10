import { EntityName, addEntity, getNamedEntity } from "../Entity";
import {
  Key,
  KeyMap,
  getLastKeyDown,
  isAnyKeyDown,
  isKeyDown,
  isKeyRepeating,
} from "../Input";
import { executeFilterQuery } from "../Query";
import { ActLike, isActLike, setActLike } from "../components/ActLike";
import { setIsVisible } from "../components/IsVisible";
import { Layer, getLayer, hasLayer, setLayer } from "../components/Layer";
import { setLookLike } from "../components/LookLike";
import { setPixiAppId } from "../components/PixiAppId";
import { hasPosition, isPosition, setPosition } from "../components/Position";
import { getPositionX } from "../components/PositionX";
import { getPositionY } from "../components/PositionY";
import { setShouldSave } from "../components/ShouldSave";
import { SPRITE_SIZE } from "../components/Sprite";
import { getPlayerIfExists } from "../functions/Player";
import { saveComponents } from "../functions/saveComponents";
import { throttle } from "../util";

if (module.hot) {
  module.hot.accept((getParents) => {
    return getParents();
  });
}

enum EditorMode {
  NORMAL,
  REPLACE,
}

enum EditorObjectPrefabs {
  WALL = "WALL",
  PLAYER = "PLAYER",
  CRATE = "CRATE",
}

const cursorIds: number[] = [];

let editorMode = EditorMode.NORMAL;

const MOVEMENT_KEY_MAPS: KeyMap<[number, number]> = {
  [Key.h]: [-1, 0],
  [Key.j]: [0, 1],
  [Key.k]: [0, -1],
  [Key.l]: [1, 0],
};

const MOVEMENT_KEYS = Object.keys(MOVEMENT_KEY_MAPS) as Key[];

const OBJECT_KEY_MAPS: KeyMap<EditorObjectPrefabs> = {
  [Key.w]: EditorObjectPrefabs.WALL,
  [Key.p]: EditorObjectPrefabs.PLAYER,
  [Key.c]: EditorObjectPrefabs.CRATE,
};

const OBJECT_KEYS = Object.keys(OBJECT_KEY_MAPS) as Key[];

const OBJECT_KEY_COLUMNS = ["key", "value"];
const OBJECT_KEY_TABLE = objectToTable(
  OBJECT_KEY_MAPS,
  OBJECT_KEY_COLUMNS[0],
  OBJECT_KEY_COLUMNS[1],
);

function finishCreatingObject(cursorId: number, objectId: number) {
  const x = getPositionX(cursorId);
  const y = getPositionY(cursorId);
  setPosition(objectId, x, y);
  setLayer(objectId, Layer.OBJECT);
  setPixiAppId(objectId, getNamedEntity(EntityName.DEFAULT_PIXI_APP));
  setShouldSave(objectId, true);
}

const OBJECT_PREFAB_FACTORY_MAP: Record<
  EditorObjectPrefabs,
  (cursoId: number) => number
> = {
  [EditorObjectPrefabs.WALL]: (cursorId: number) => {
    const entityId =
      getEntityAt(
        getPositionX(cursorId),
        getPositionY(cursorId),
        Layer.OBJECT,
      ) ?? addEntity();
    setActLike(entityId, ActLike.BARRIER);
    setLookLike(entityId, getNamedEntity(EntityName.WALL_IMAGE));
    finishCreatingObject(cursorId, entityId);
    return entityId;
  },
  [EditorObjectPrefabs.CRATE]: (cursorId: number) => {
    const entityId =
      getEntityAt(
        getPositionX(cursorId),
        getPositionY(cursorId),
        Layer.OBJECT,
      ) ?? addEntity();
    setActLike(entityId, ActLike.PUSHABLE);
    setLookLike(entityId, getNamedEntity(EntityName.CRATE_IMAGE));
    finishCreatingObject(cursorId, entityId);
    return entityId;
  },
  [EditorObjectPrefabs.PLAYER]: (cursorId: number) => {
    const entityId = getPlayerIfExists() ?? addEntity();
    setActLike(entityId, ActLike.PLAYER);
    setLookLike(entityId, getNamedEntity(EntityName.PLAYER_DOWN_IMAGE));
    finishCreatingObject(cursorId, entityId);
    return entityId;
  },
};

function getEditorCursors(): ReadonlyArray<number> {
  cursorIds.length = 0;
  return executeFilterQuery(
    (entityId) => isActLike(entityId, ActLike.EDITOR_CURSOR),
    cursorIds,
  );
}

function moveCursorByTiles(cursorId: number, dx: number, dy: number) {
  const x = getPositionX(cursorId);
  const y = getPositionY(cursorId);
  setPosition(cursorId, x + dx * SPRITE_SIZE, y + dy * SPRITE_SIZE);
}

const slowThrottledMoveCursorByTiles = throttle(moveCursorByTiles, 700);
const fastThrottledMoveCursorByTiles = throttle(moveCursorByTiles, 50);

function enterNormalMode(cursorId: number) {
  editorMode = EditorMode.NORMAL;
  setLookLike(cursorId, getNamedEntity(EntityName.EDITOR_NORMAL_CURSOR_IMAGE));
  console.log("mode=Normal, layer=Object");
}

function enterReplaceMode(cursorId: number) {
  editorMode = EditorMode.REPLACE;
  setLookLike(cursorId, getNamedEntity(EntityName.EDITOR_REPLACE_CURSOR_IMAGE));
  console.log("mode=Replace, layer=Object");
  console.log("press a key to place an object");
  console.table(OBJECT_KEY_TABLE, OBJECT_KEY_COLUMNS);
}

function objectToTable<T extends Record<string, any>>(
  object: T,
  keyColumnLabel: string,
  valueColumnLabel: string,
): Array<{ [key: string]: any }> {
  return Object.entries(object).map(([key, value]) => ({
    [keyColumnLabel]: key,
    [valueColumnLabel]: value,
  }));
}

const entityIds: number[] = [];
function getEntityAt(x: number, y: number, layer: Layer): number | undefined {
  entityIds.length = 0;
  executeFilterQuery(
    (entityId) =>
      hasPosition(entityId) &&
      isPosition(entityId, x, y) &&
      hasLayer(entityId) &&
      layer === getLayer(entityId),
    entityIds,
  );
  return entityIds[0];
}

export function EditorSystem() {
  const cursorIds = getEditorCursors();
  if (cursorIds.length === 0) {
    const cursorId = addEntity();
    setLookLike(
      cursorId,
      getNamedEntity(EntityName.EDITOR_NORMAL_CURSOR_IMAGE),
    );
    setActLike(cursorId, ActLike.EDITOR_CURSOR);
    setPosition(cursorId, 0, 0);
    setPixiAppId(cursorId, getNamedEntity(EntityName.DEFAULT_PIXI_APP));
    setLayer(cursorId, Layer.USER_INTERFACE);
  }

  for (const cursorId of cursorIds) {
    const lastKeyDown = getLastKeyDown()!;

    setIsVisible(cursorId, true);

    switch (editorMode) {
      case EditorMode.NORMAL:
        if (
          MOVEMENT_KEYS.includes(lastKeyDown) &&
          isAnyKeyDown(MOVEMENT_KEYS)
        ) {
          const throttledMoveCursorByTiles = isKeyRepeating(lastKeyDown)
            ? fastThrottledMoveCursorByTiles
            : slowThrottledMoveCursorByTiles;
          const [dx, dy] = MOVEMENT_KEY_MAPS[lastKeyDown]!;
          throttledMoveCursorByTiles(cursorId, dx, dy);
        } else {
          slowThrottledMoveCursorByTiles.cancel();
        }
        if (lastKeyDown === Key.r) {
          enterReplaceMode(cursorId);
        }
        if (isKeyDown(Key.W)) {
          saveComponents();
        }
        break;
      case EditorMode.REPLACE:
        if (lastKeyDown === Key.Escape) {
          enterNormalMode(cursorId);
        }

        if (OBJECT_KEYS.includes(lastKeyDown)) {
          const objectPrefab = OBJECT_KEY_MAPS[lastKeyDown]!;
          OBJECT_PREFAB_FACTORY_MAP[objectPrefab](cursorId);
          enterNormalMode(cursorId);
        }
        break;
    }
  }
}

export function cleanupEditorSystem() {
  const cursorIds = getEditorCursors();
  for (const cursorId of cursorIds) {
    setIsVisible(cursorId, false);
  }
}

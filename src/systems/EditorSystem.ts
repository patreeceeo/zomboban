import { ComponentName, selectComponentData } from "../ComponentData";
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
import {
  Orientation,
  hasOrientation,
  setOrientation,
} from "../components/Orientation";
import { setPixiAppId } from "../components/PixiAppId";
import { hasPosition, isPosition, setPosition } from "../components/Position";
import { getPositionX } from "../components/PositionX";
import { getPositionY } from "../components/PositionY";
import { setShouldSave, shouldSave } from "../components/ShouldSave";
import { setToBeRemoved } from "../components/ToBeRemoved";
import { COMPONENT_DATA_URL } from "../constants";
import { getPlayerIfExists } from "../functions/Player";
import {
  SCREEN_TILE,
  convertPixelsToTilesX,
  convertPixelsToTilesY,
  convertTilesXToPixels,
  convertTilesYToPixels,
} from "../units/convert";
import { deflateString, throttle } from "../util";
import { followEntityWithCamera } from "./CameraSystem";

enum EditorMode {
  NORMAL,
  REPLACE,
  ORIENT,
}

enum EditorObjectPrefabs {
  WALL = "WALL",
  PLAYER = "PLAYER",
  CRATE = "CRATE",
  ZOMBIE = "ZOMBIE",
}

const cursorIds: number[] = [];

let editorMode = EditorMode.NORMAL;

const MOVEMENT_KEY_MAPS = {
  [Key.h]: [-1, 0],
  [Key.j]: [0, 1],
  [Key.k]: [0, -1],
  [Key.l]: [1, 0],
} as KeyMap<[TilesX, TilesY]>;

const MOVEMENT_KEYS = Object.keys(MOVEMENT_KEY_MAPS) as Key[];

const ORIENTATION_KEY_MAPS = {
  [Key.h]: Orientation.Left,
  [Key.j]: Orientation.Down,
  [Key.k]: Orientation.Up,
  [Key.l]: Orientation.Right,
} as KeyMap<Orientation>;

const OBJECT_KEY_MAPS: KeyMap<EditorObjectPrefabs> = {
  [Key.w]: EditorObjectPrefabs.WALL,
  [Key.p]: EditorObjectPrefabs.PLAYER,
  [Key.c]: EditorObjectPrefabs.CRATE,
  [Key.z]: EditorObjectPrefabs.ZOMBIE,
};

const OBJECT_KEYS = Object.keys(OBJECT_KEY_MAPS) as Key[];

const OBJECT_KEY_COLUMNS = ["key", "value"];
const OBJECT_KEY_TABLE = objectToTable(
  OBJECT_KEY_MAPS,
  OBJECT_KEY_COLUMNS[0],
  OBJECT_KEY_COLUMNS[1],
);

function getEntityAtCursor(
  cursorId: number,
  layer = Layer.OBJECT,
): number | undefined {
  return getEntityAt(getPositionX(cursorId), getPositionY(cursorId), layer);
}

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
    const entityId = getEntityAtCursor(cursorId) ?? addEntity();
    setActLike(entityId, ActLike.BARRIER);
    setLookLike(entityId, getNamedEntity(EntityName.WALL_IMAGE));
    finishCreatingObject(cursorId, entityId);
    return entityId;
  },
  [EditorObjectPrefabs.CRATE]: (cursorId: number) => {
    const entityId = getEntityAtCursor(cursorId) ?? addEntity();
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
  [EditorObjectPrefabs.ZOMBIE]: (cursorId: number) => {
    const entityId = getEntityAtCursor(cursorId) ?? addEntity();
    setActLike(entityId, ActLike.ZOMBIE);
    setLookLike(entityId, getNamedEntity(EntityName.ZOMBIE_DOWN_IMAGE));
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

function moveCursorByTiles(cursorId: number, dx: TilesX, dy: TilesY) {
  const x = getPositionX(cursorId);
  const y = getPositionY(cursorId);
  setPosition(
    cursorId,
    (x + convertTilesXToPixels(dx)) as Px,
    (y + convertTilesYToPixels(dy)) as Px,
  );
}

const slowThrottledMoveCursorByTiles = throttle(moveCursorByTiles, 700);
const fastThrottledMoveCursorByTiles = throttle(moveCursorByTiles, 50);

function enterNormalMode(cursorId: number) {
  editorMode = EditorMode.NORMAL;
  setLookLike(cursorId, getNamedEntity(EntityName.EDITOR_NORMAL_CURSOR_IMAGE));
  console.log("mode=Normal, layer=Object");
}

function enterOrientMode(cursorId: number) {
  editorMode = EditorMode.ORIENT;
  setLookLike(cursorId, getNamedEntity(EntityName.EDITOR_ORIENT_CURSOR_IMAGE));
  console.log("mode=Orient, layer=Object");
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
function getEntityAt(x: Px, y: Px, layer: Layer): number | undefined {
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

const COMPONENTS_TO_SAVE = [
  ComponentName.ActLike,
  ComponentName.Layer,
  ComponentName.LookLike,
  ComponentName.PixiAppId,
  ComponentName.PositionX,
  ComponentName.PositionY,
  ComponentName.ShouldSave,
];

function listShouldSaveEntities(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(shouldSave, entityIds);
}

function postComponentData() {
  const shouldSaveEntities = listShouldSaveEntities();
  const json = JSON.stringify(
    selectComponentData(COMPONENTS_TO_SAVE, shouldSaveEntities),
  );
  const body = deflateString(json);
  fetch(COMPONENT_DATA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: body,
  });
}

const throttledPostComponentData = throttle(postComponentData, 500);

export function EditorSystem() {
  const cursorIds = getEditorCursors();
  if (cursorIds.length === 0) {
    const cursorId = addEntity();
    setLookLike(
      cursorId,
      getNamedEntity(EntityName.EDITOR_NORMAL_CURSOR_IMAGE),
    );
    setActLike(cursorId, ActLike.EDITOR_CURSOR);
    setPosition(cursorId, 0 as Px, 0 as Px);
    setPixiAppId(cursorId, getNamedEntity(EntityName.DEFAULT_PIXI_APP));
    setLayer(cursorId, Layer.USER_INTERFACE);
  }

  for (const cursorId of cursorIds) {
    const lastKeyDown = getLastKeyDown()!;

    setIsVisible(cursorId, true);

    followEntityWithCamera(cursorId);

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

        if (lastKeyDown === Key.o) {
          enterOrientMode(cursorId);
        }

        if (isKeyDown(Key.W)) {
          throttledPostComponentData();
        }

        if (isKeyDown(Key.x)) {
          const entityId = getEntityAt(
            getPositionX(cursorId),
            getPositionY(cursorId),
            Layer.OBJECT,
          );
          if (entityId !== undefined) {
            setToBeRemoved(entityId, true);
          }
          const x = getPositionX(cursorId);
          const y = getPositionY(cursorId);
          const bgId = getEntityAt(x, y, Layer.BACKGROUND) ?? addEntity();
          setLookLike(bgId, getNamedEntity(EntityName.FLOOR_IMAGE));
          setLayer(bgId, Layer.BACKGROUND);
          setPixiAppId(bgId, getNamedEntity(EntityName.DEFAULT_PIXI_APP));
          setPosition(bgId, x, y);
          setShouldSave(bgId, true);
        }
        if (isKeyDown(Key.G)) {
          const cameraId = getNamedEntity(EntityName.CAMERA);
          const cameraTileX = convertPixelsToTilesX(getPositionX(cameraId));
          const cameraTileY = convertPixelsToTilesY(getPositionY(cameraId));

          for (
            let tileX = cameraTileX - SCREEN_TILE / 2;
            tileX < cameraTileX + SCREEN_TILE / 2;
            tileX++
          ) {
            for (
              let tileY = cameraTileY - SCREEN_TILE / 2;
              tileY < cameraTileY + SCREEN_TILE / 2;
              tileY++
            ) {
              const x = convertTilesXToPixels(tileX as TilesX);
              const y = convertTilesYToPixels(tileY as TilesY);
              const id = getEntityAt(x, y, Layer.OBJECT) ?? addEntity();
              setLayer(id, Layer.OBJECT);
              setPosition(id, x, y);
              setLookLike(id, getNamedEntity(EntityName.WALL_IMAGE));
              setActLike(id, ActLike.BARRIER);
              setPixiAppId(id, getNamedEntity(EntityName.DEFAULT_PIXI_APP));
              setShouldSave(id, true);
            }
          }
        }
        break;
      case EditorMode.REPLACE:
        if (lastKeyDown === Key.Escape) {
          enterNormalMode(cursorId);
        }

        if (OBJECT_KEYS.includes(lastKeyDown)) {
          const objectPrefab = OBJECT_KEY_MAPS[lastKeyDown]!;
          const id = OBJECT_PREFAB_FACTORY_MAP[objectPrefab](cursorId);
          if (hasOrientation(id)) {
            enterOrientMode(cursorId);
          } else {
            enterNormalMode(cursorId);
          }
        }
        break;
      case EditorMode.ORIENT:
        if (lastKeyDown === Key.Escape) {
          enterNormalMode(cursorId);
        }
        if (MOVEMENT_KEYS.includes(lastKeyDown)) {
          const orientation = ORIENTATION_KEY_MAPS[lastKeyDown]!;
          const entityId = getEntityAtCursor(cursorId);
          if (entityId !== undefined) {
            setOrientation(entityId, orientation);
          }
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

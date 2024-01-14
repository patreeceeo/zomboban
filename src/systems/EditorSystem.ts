import {
  hasComponentData,
  removeComponentData,
  selectComponentData,
  serializeComponentData,
} from "../Component";
import {
  addEntity,
  autoRemoveEntities,
  listRemovedEntities,
  recycleRemovedEntities,
} from "../Entity";
import {
  Key,
  KeyMap,
  isKeyDown,
  isKeyRepeating,
  createInputQueue,
  getLastKeyDown,
} from "../Input";
import { executeFilterQuery } from "../Query";
import {
  BoxBehavior,
  BroBehavior,
  PlayerBehavior,
  WallBehavior,
} from "../behaviors";
import { CursorBehavior } from "../behaviors/CursorBehavior";
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
import {
  EntityFrameOperation,
  setEntityFrameOperation,
} from "../components/EntityFrameOperation";
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
import { ReservedEntity } from "../entities";

if (import.meta.hot) {
  import.meta.hot.accept("../constants", () => {});
}

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
  [Key.w]: [0, -1],
  [Key.a]: [-1, 0],
  [Key.s]: [0, 1],
  [Key.d]: [1, 0],
} as KeyMap<[TilesX, TilesY]>;

const MOVEMENT_KEYS = [Key.w, Key.a, Key.s, Key.d];

const ORIENTATION_KEY_MAPS = {
  [Key.h]: Orientation.Left,
  [Key.j]: Orientation.Down,
  [Key.k]: Orientation.Up,
  [Key.l]: Orientation.Right,
} as KeyMap<Orientation>;

const OBJECT_KEY_MAPS: KeyMap<EditorObjectPrefabs> = {
  [Key.w]: EditorObjectPrefabs.WALL,
  [Key.p]: EditorObjectPrefabs.PLAYER,
  [Key.b]: EditorObjectPrefabs.CRATE,
  [Key.z]: EditorObjectPrefabs.ZOMBIE,
};

const OBJECT_KEYS = [Key.w, Key.p, Key.b, Key.z];

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
  setPixiAppId(objectId, ReservedEntity.DEFAULT_PIXI_APP);
  setShouldSave(objectId, true);
}

const OBJECT_PREFAB_FACTORY_MAP: Record<
  EditorObjectPrefabs,
  (cursoId: number) => number
> = {
  [EditorObjectPrefabs.WALL]: (cursorId: number) => {
    const entityId = addEntity();
    setActLike(entityId, new WallBehavior(entityId));
    setLookLike(entityId, ReservedEntity.WALL_IMAGE);
    finishCreatingObject(cursorId, entityId);
    return entityId;
  },
  [EditorObjectPrefabs.CRATE]: (cursorId: number) => {
    const entityId = addEntity();
    setActLike(entityId, new BoxBehavior(entityId));
    setLookLike(entityId, ReservedEntity.CRATE_IMAGE);
    finishCreatingObject(cursorId, entityId);
    return entityId;
  },
  [EditorObjectPrefabs.PLAYER]: (cursorId: number) => {
    const entityId = getPlayerIfExists() ?? addEntity();
    setActLike(entityId, new PlayerBehavior(entityId));
    setLookLike(entityId, ReservedEntity.PLAYER_DOWN_IMAGE);
    finishCreatingObject(cursorId, entityId);
    return entityId;
  },
  [EditorObjectPrefabs.ZOMBIE]: (cursorId: number) => {
    const entityId = addEntity();
    setActLike(entityId, new BroBehavior(entityId));
    setLookLike(entityId, ReservedEntity.ZOMBIE_SWAY_ANIMATION);
    finishCreatingObject(cursorId, entityId);
    return entityId;
  },
};

function getEditorCursors(): ReadonlyArray<number> {
  cursorIds.length = 0;
  return executeFilterQuery(
    (entityId) => isActLike(entityId, ActLike.CURSOR),
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

const slowThrottledMoveCursorByTiles = throttle(moveCursorByTiles, 350);
const fastThrottledMoveCursorByTiles = throttle(moveCursorByTiles, 50);

function enterNormalMode(cursorId: number) {
  editorMode = EditorMode.NORMAL;
  setLookLike(cursorId, ReservedEntity.EDITOR_NORMAL_CURSOR_IMAGE);
  console.log("mode=Normal, layer=Object");
}

function enterOrientMode(cursorId: number) {
  editorMode = EditorMode.ORIENT;
  setLookLike(cursorId, ReservedEntity.EDITOR_ORIENT_CURSOR_IMAGE);
  console.log("mode=Orient, layer=Object");
}

function enterReplaceMode(cursorId: number) {
  editorMode = EditorMode.REPLACE;
  setLookLike(cursorId, ReservedEntity.EDITOR_REPLACE_CURSOR_IMAGE);
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
  "ActLike",
  "Layer",
  "LookLike",
  "PixiAppId",
  "PositionX",
  "PositionY",
  "ShouldSave",
];

function listShouldSaveEntities(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(shouldSave, entityIds);
}

function postComponentData() {
  const shouldSaveEntities = listShouldSaveEntities();
  const data = selectComponentData(COMPONENTS_TO_SAVE, shouldSaveEntities);
  const serializedData = serializeComponentData(data);
  const body = deflateString(serializedData);
  fetch(COMPONENT_DATA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    },
    body: body,
  });
}

const throttledPostComponentData = throttle(postComponentData, 500);

// TODO not the best name..?
function markForRemovalAt(x: Px, y: Px) {
  const entityId = getEntityAt(x, y, Layer.OBJECT);
  if (entityId !== undefined) {
    setEntityFrameOperation(entityId, EntityFrameOperation.REMOVE);
  }
}

const inputQueue = createInputQueue();

export function EditorSystem() {
  const cursorIds = getEditorCursors();
  let cursorId: number;

  autoRemoveEntities(hasComponentData);
  // TODO IF want to undo in editor, this needs to be handled differently
  for (const entityId of listRemovedEntities()) {
    removeComponentData(entityId);
  }
  recycleRemovedEntities();

  if (cursorIds.length === 0) {
    cursorId = addEntity();
    setLookLike(cursorId, ReservedEntity.EDITOR_NORMAL_CURSOR_IMAGE);
    setActLike(cursorId, new CursorBehavior(cursorId));
    setPosition(cursorId, 0 as Px, 0 as Px);
    setPixiAppId(cursorId, ReservedEntity.DEFAULT_PIXI_APP);
    setLayer(cursorId, Layer.USER_INTERFACE);
  } else {
    cursorId = cursorIds[0];
  }

  setIsVisible(cursorId, true);

  followEntityWithCamera(cursorId);

  const newInputMaybe = inputQueue.shift();
  if (newInputMaybe === undefined) {
    slowThrottledMoveCursorByTiles.cancel();
    return;
  }
  const nextInput = newInputMaybe!;
  const lastKeyDown = getLastKeyDown()!;

  const x = getPositionX(cursorId);
  const y = getPositionY(cursorId);

  switch (editorMode) {
    case EditorMode.NORMAL:
      if (MOVEMENT_KEYS.includes(newInputMaybe)) {
        const throttledMoveCursorByTiles = isKeyRepeating(nextInput)
          ? fastThrottledMoveCursorByTiles
          : slowThrottledMoveCursorByTiles;
        const [dx, dy] = MOVEMENT_KEY_MAPS[nextInput as Key]!;
        throttledMoveCursorByTiles(cursorId, dx, dy);
      }
      if (nextInput === Key.r) {
        enterReplaceMode(cursorId);
      }

      if (isKeyDown(Key.w | Key.Shift)) {
        throttledPostComponentData();
      }

      if (isKeyDown(Key.x)) {
        markForRemovalAt(x, y);
        const bgId = getEntityAt(x, y, Layer.BACKGROUND) ?? addEntity();
        setLookLike(bgId, ReservedEntity.FLOOR_IMAGE);
        setLayer(bgId, Layer.BACKGROUND);
        setPixiAppId(bgId, ReservedEntity.DEFAULT_PIXI_APP);
        setPosition(bgId, x, y);
        setShouldSave(bgId, true);
      }
      if (isKeyDown(Key.g | Key.Shift)) {
        const cameraId = ReservedEntity.CAMERA;
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
            setLookLike(id, ReservedEntity.WALL_IMAGE);
            setPixiAppId(id, ReservedEntity.DEFAULT_PIXI_APP);
            setShouldSave(id, true);
            setActLike(id, new WallBehavior(id));
          }
        }
      }
      break;
    case EditorMode.REPLACE:
      if (lastKeyDown === Key.Escape) {
        enterNormalMode(cursorId);
      }

      if (OBJECT_KEYS.includes(lastKeyDown)) {
        markForRemovalAt(x, y);
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

export function stopEditorSystem() {
  const cursorIds = getEditorCursors();
  for (const cursorId of cursorIds) {
    setIsVisible(cursorId, false);
  }
}

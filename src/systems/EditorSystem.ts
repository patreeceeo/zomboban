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
import { KEY_MAPS } from "../constants";
import {
  SCREEN_TILE,
  convertPixelsToTilesX,
  convertPixelsToTilesY,
  convertTilesXToPixels,
  convertTilesYToPixels,
} from "../units/convert";
import { throttle } from "../util";
import { followEntityWithCamera } from "./CameraSystem";
import { ReservedEntity } from "../entities";
import { mutState, state } from "../state";
import { LayerId } from "../components/Layer";
import { deleteEntity } from "../functions/Client";

if (import.meta.hot) {
  import.meta.hot.accept("../constants", () => {});
}

enum EditorMode {
  NORMAL,
  REPLACE,
  // TODO use orientation of the cursor
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

function finishCreatingObject(cursorId: number, objectId: number) {
  const x = state.getPositionX(cursorId);
  const y = state.getPositionY(cursorId);
  mutState.setPosition(objectId, x, y);
  mutState.setLayer(objectId, LayerId.Object);
  mutState.setShouldSaveEntity(objectId, true);
  mutState.setWorldId(objectId, state.currentWorldId);
}

const OBJECT_PREFAB_FACTORY_MAP: Record<
  EditorObjectPrefabs,
  (cursoId: number) => number
> = {
  [EditorObjectPrefabs.WALL]: (cursorId: number) => {
    const entityId = mutState.addEntity();
    mutState.setBehavior(entityId, new WallBehavior(entityId));
    mutState.setImageId(entityId, ReservedEntity.WALL_IMAGE);
    finishCreatingObject(cursorId, entityId);
    return entityId;
  },
  [EditorObjectPrefabs.CRATE]: (cursorId: number) => {
    const entityId = mutState.addEntity();
    mutState.setBehavior(entityId, new BoxBehavior(entityId));
    mutState.setImageId(entityId, ReservedEntity.CRATE_IMAGE);
    finishCreatingObject(cursorId, entityId);
    return entityId;
  },
  [EditorObjectPrefabs.PLAYER]: (cursorId: number) => {
    const entityId = state.playerId ?? mutState.addEntity();
    mutState.setBehavior(entityId, new PlayerBehavior(entityId));
    mutState.setImageId(entityId, ReservedEntity.PLAYER_DOWN_IMAGE);
    finishCreatingObject(cursorId, entityId);
    return entityId;
  },
  [EditorObjectPrefabs.ZOMBIE]: (cursorId: number) => {
    const entityId = mutState.addEntity();
    mutState.setBehavior(entityId, new BroBehavior(entityId));
    mutState.setImageId(entityId, ReservedEntity.ZOMBIE_SWAY_ANIMATION);
    finishCreatingObject(cursorId, entityId);
    return entityId;
  },
};

function getEditorCursors(): ReadonlyArray<number> {
  cursorIds.length = 0;
  return executeFilterQuery(
    (entityId) => state.isBehavior(entityId, CursorBehavior),
    cursorIds,
    state.addedEntities,
  );
}

function moveCursorByTiles(cursorId: number, dx: TilesX, dy: TilesY) {
  const x = state.getPositionX(cursorId);
  const y = state.getPositionY(cursorId);
  mutState.setPosition(
    cursorId,
    (x + convertTilesXToPixels(dx)) as Px,
    (y + convertTilesYToPixels(dy)) as Px,
  );
}

const slowThrottledMoveCursorByTiles = throttle(moveCursorByTiles, 350);
const fastThrottledMoveCursorByTiles = throttle(moveCursorByTiles, 50);

function enterNormalMode(cursorId: number) {
  editorMode = EditorMode.NORMAL;
  mutState.setImageId(cursorId, ReservedEntity.EDITOR_NORMAL_CURSOR_IMAGE);
  console.log("mode=Normal, layer=Object");
}

function enterReplaceMode(cursorId: number) {
  editorMode = EditorMode.REPLACE;
  mutState.setImageId(cursorId, ReservedEntity.EDITOR_REPLACE_CURSOR_IMAGE);
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
function getEntityAt(x: Px, y: Px, layer: LayerId): number | undefined {
  entityIds.length = 0;
  executeFilterQuery(
    (entityId) =>
      state.hasPositionX(entityId) &&
      state.getPositionX(entityId) === x &&
      state.hasPositionY(entityId) &&
      state.getPositionY(entityId) === y &&
      state.isOnLayer(entityId, layer),
    entityIds,
    state.addedEntities,
  );
  return entityIds[0];
}

// TODO not the best name..?
function markForRemovalAt(x: Px, y: Px) {
  const entityId = getEntityAt(x, y, LayerId.Object);
  if (entityId !== undefined) {
    mutState.setToBeRemovedThisFrame(entityId);
    if (state.hasGuid(entityId)) {
      deleteEntity(state.getGuid(entityId));
    }
  }
}

const inputQueue = createInputQueue();

function recycleEntities() {
  const { removedEntities } = state;
  for (const entityId of removedEntities) {
    mutState.recycleEntity(entityId);
  }
}

export function EditorSystem() {
  const cursorIds = getEditorCursors();
  let cursorId: number;

  if (cursorIds.length === 0) {
    cursorId = mutState.addEntity();
    mutState.setImageId(cursorId, ReservedEntity.EDITOR_NORMAL_CURSOR_IMAGE);
    mutState.setBehavior(cursorId, new CursorBehavior(cursorId));
    mutState.setPosition(cursorId, 0 as Px, 0 as Px);
    mutState.setLayer(cursorId, LayerId.UI);
  } else {
    cursorId = cursorIds[0];
  }

  followEntityWithCamera(cursorId);
  recycleEntities();

  const newInputMaybe = inputQueue.shift();
  if (newInputMaybe === undefined) {
    slowThrottledMoveCursorByTiles.cancel();
    return; ////////// EARLY RETURN //////////
  }
  const nextInput = newInputMaybe!;
  const lastKeyDown = getLastKeyDown()!;

  const x = state.getPositionX(cursorId);
  const y = state.getPositionY(cursorId);

  switch (editorMode) {
    case EditorMode.NORMAL:
      if (nextInput in KEY_MAPS.MOVE) {
        const throttledMoveCursorByTiles = isKeyRepeating(nextInput)
          ? fastThrottledMoveCursorByTiles
          : slowThrottledMoveCursorByTiles;
        const [dx, dy] = KEY_MAPS.MOVE[nextInput as Key]!;
        throttledMoveCursorByTiles(cursorId, dx as TilesX, dy);
      }
      if (nextInput === Key.r) {
        enterReplaceMode(cursorId);
      }

      if (isKeyDown(Key.x)) {
        markForRemovalAt(x, y);
      }
      if (isKeyDown(Key.g | Key.Shift)) {
        const cameraId = ReservedEntity.CAMERA;
        const cameraTileX = convertPixelsToTilesX(state.getPositionX(cameraId));
        const cameraTileY = convertPixelsToTilesY(state.getPositionY(cameraId));

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
            OBJECT_PREFAB_FACTORY_MAP[EditorObjectPrefabs.WALL](cursorId);
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
        mutState.postEntity(id);
        enterNormalMode(cursorId);
      }
      break;
  }
}

export function stopEditorSystem() {
  const cursorIds = getEditorCursors();
  for (const cursorId of cursorIds) {
    mutState.setVisible(cursorId, false);
  }
}

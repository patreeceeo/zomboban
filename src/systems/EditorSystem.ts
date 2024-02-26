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
import { state } from "../state";
import { LayerId, LayerIdComponent } from "../components/LayerId";
import { deleteEntity } from "../functions/Client";
import {
  BehaviorComponent,
  GuidComponent,
  TextureIdComponent,
  IsVisibleComponent,
  PositionComponent,
  ShouldSaveComponent,
  WorldIdComponent,
  SpriteComponent,
} from "../components";
import { Vector3 } from "../Vector3";
import {
  EntityFrameOperation,
  EntityFrameOperationComponent,
} from "../components/EntityFrameOperation";

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

const _v3 = new Vector3();

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

function createBaseObject(cursorId: number, objectId: number) {
  state.acquire(SpriteComponent, objectId);
  state.copy(
    PositionComponent,
    objectId,
    state.get(PositionComponent, cursorId),
  );
  state.set(LayerIdComponent, objectId, LayerId.Object);
  state.set(ShouldSaveComponent, objectId, true);
  state.set(WorldIdComponent, objectId, state.currentWorldId);
}

const OBJECT_PREFAB_FACTORY_MAP: Record<
  EditorObjectPrefabs,
  (cursoId: number) => number
> = {
  [EditorObjectPrefabs.WALL]: (cursorId: number) => {
    const entityId = state.addEntity();
    createBaseObject(cursorId, entityId);
    state.set(BehaviorComponent, entityId, new WallBehavior(entityId));
    state.set(TextureIdComponent, entityId, ReservedEntity.WALL_IMAGE);
    return entityId;
  },
  [EditorObjectPrefabs.CRATE]: (cursorId: number) => {
    const entityId = state.addEntity();
    createBaseObject(cursorId, entityId);
    state.set(BehaviorComponent, entityId, new BoxBehavior(entityId));
    state.set(TextureIdComponent, entityId, ReservedEntity.CRATE_IMAGE);
    return entityId;
  },
  // TODO this should be a spawn point, not a player
  [EditorObjectPrefabs.PLAYER]: (cursorId: number) => {
    const entityId = state.addEntity();
    createBaseObject(cursorId, entityId);
    state.set(BehaviorComponent, entityId, new PlayerBehavior(entityId));
    state.set(TextureIdComponent, entityId, ReservedEntity.PLAYER_DOWN_IMAGE);
    return entityId;
  },
  [EditorObjectPrefabs.ZOMBIE]: (cursorId: number) => {
    const entityId = state.addEntity();
    createBaseObject(cursorId, entityId);
    state.set(BehaviorComponent, entityId, new BroBehavior(entityId));
    state.set(
      TextureIdComponent,
      entityId,
      ReservedEntity.ZOMBIE_SWAY_ANIMATION,
    );
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
  const { x, y } = state.get(PositionComponent, cursorId);
  state.copy(
    PositionComponent,
    cursorId,
    _v3.set(
      x + convertTilesXToPixels(dx),
      y + convertTilesYToPixels(dy),
      0,
    ) as Vector3<Px>,
  );
}

const slowThrottledMoveCursorByTiles = throttle(moveCursorByTiles, 350);
const fastThrottledMoveCursorByTiles = throttle(moveCursorByTiles, 50);

function enterNormalMode(cursorId: number) {
  editorMode = EditorMode.NORMAL;
  state.set(
    TextureIdComponent,
    cursorId,
    ReservedEntity.EDITOR_NORMAL_CURSOR_IMAGE,
  );
  console.log("mode=Normal, layer=Object");
}

function enterReplaceMode(cursorId: number) {
  editorMode = EditorMode.REPLACE;
  state.set(
    TextureIdComponent,
    cursorId,
    ReservedEntity.EDITOR_REPLACE_CURSOR_IMAGE,
  );
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

const PositionedObjectsQuery = state
  .buildQuery({
    all: [PositionComponent, LayerIdComponent],
  })
  .addParam("x", 0)
  .addParam("y", 0)
  .complete(({ entityId, x, y }) => {
    // console.log(
    //   entityId,
    //   x,
    //   y,
    //   state.get(PositionComponent, entityId).toArray()
    // );
    return (
      state.is(PositionComponent, entityId, _v3.set(x, y, 0) as Vector3<Px>) &&
      state.is(LayerIdComponent, entityId, LayerId.Object)
    );
  });

function getEntityAt(x: Px, y: Px): number | undefined {
  PositionedObjectsQuery.setParam("x", x).setParam("y", y);
  return PositionedObjectsQuery().at(0);
}

// TODO not the best name..?
function markForRemovalAt(x: Px, y: Px) {
  const entityId = getEntityAt(x, y);
  console.log("removing entity", entityId, "at", x, y);
  if (entityId !== undefined) {
    state.set(
      EntityFrameOperationComponent,
      entityId,
      EntityFrameOperation.REMOVE,
    );
    if (state.has(GuidComponent, entityId)) {
      deleteEntity(state.get(GuidComponent, entityId));
    }
  }
}

const inputQueue = createInputQueue();

function recycleEntities() {
  const { removedEntities } = state;
  for (const entityId of removedEntities) {
    state.recycleEntity(entityId);
  }
}

export function EditorSystem() {
  const cursorIds = getEditorCursors();
  let cursorId: number;

  if (cursorIds.length === 0) {
    cursorId = state.addEntity();
    state.acquire(SpriteComponent, cursorId);
    state.set(
      TextureIdComponent,
      cursorId,
      ReservedEntity.EDITOR_NORMAL_CURSOR_IMAGE,
    );
    state.set(BehaviorComponent, cursorId, new CursorBehavior(cursorId));
    state.set(LayerIdComponent, cursorId, LayerId.UI);
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

  const { x: cursorX, y: cursorY } = state.get(PositionComponent, cursorId);

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
        markForRemovalAt(cursorX, cursorY);
      }
      if (isKeyDown(Key.g | Key.Shift)) {
        const cursorTileX = convertPixelsToTilesX(cursorX);
        const cursorTileY = convertPixelsToTilesY(cursorY);

        for (
          let tileX = cursorTileX - SCREEN_TILE / 2;
          tileX < cursorTileX + SCREEN_TILE / 2;
          tileX++
        ) {
          for (
            let tileY = cursorTileY - SCREEN_TILE / 2;
            tileY < cursorTileY + SCREEN_TILE / 2;
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
        markForRemovalAt(cursorX, cursorY);
        const objectPrefab = OBJECT_KEY_MAPS[lastKeyDown]!;
        const id = OBJECT_PREFAB_FACTORY_MAP[objectPrefab](cursorId);
        state.postEntity(id);
        enterNormalMode(cursorId);
      }
      break;
  }
}

export function startEditorSystem() {
  const cursorIds = getEditorCursors();
  for (const cursorId of cursorIds) {
    state.set(IsVisibleComponent, cursorId, true);
  }
}

export function stopEditorSystem() {
  const cursorIds = getEditorCursors();
  for (const cursorId of cursorIds) {
    state.set(IsVisibleComponent, cursorId, false);
  }
}

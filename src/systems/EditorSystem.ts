import { State } from "../state";
import { System } from "../System";
import { CursorEntity } from "../entities/CursorEntity";

export class EditorSystem extends System<State> {
  #cursor: ReturnType<typeof CursorEntity.create> | undefined;
  start(state: State) {
    if (this.#cursor === undefined) {
      this.#cursor = state.addEntity(CursorEntity.create);
    }
  }
  stop(state: State) {
    if (this.#cursor !== undefined) {
      CursorEntity.destroy(this.#cursor);
      state.removeEntity(this.#cursor);
    }
  }
}

/*
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * TODO remove old code
 */

// enum EditorMode {
//   NORMAL,
//   REPLACE,
//   // TODO use orientation of the cursor
//   ORIENT
// }

// enum EditorObjectPrefabs {
//   WALL = "WALL",
//   PLAYER = "PLAYER",
//   CRATE = "CRATE",
//   ZOMBIE = "ZOMBIE"
// }

// const _v3 = new Vector3();

// const cursorIds: number[] = [];

// let editorMode = EditorMode.NORMAL;

// const OBJECT_KEY_MAPS: KeyMap<EditorObjectPrefabs> = {
//   [Key.w]: EditorObjectPrefabs.WALL,
//   [Key.p]: EditorObjectPrefabs.PLAYER,
//   [Key.b]: EditorObjectPrefabs.CRATE,
//   [Key.z]: EditorObjectPrefabs.ZOMBIE
// };

// const OBJECT_KEYS = [Key.w, Key.p, Key.b, Key.z];

// const OBJECT_KEY_COLUMNS = ["key", "value"];
// const OBJECT_KEY_TABLE = objectToTable(
//   OBJECT_KEY_MAPS,
//   OBJECT_KEY_COLUMNS[0],
//   OBJECT_KEY_COLUMNS[1]
// );

// function createBaseObject(cursorId: number, objectId: number) {
//   // stateOld.acquire(SpriteComponent, objectId);
//   stateOld.copy(
//     PositionComponent,
//     objectId,
//     stateOld.get(PositionComponent, cursorId)
//   );
//   stateOld.set(LayerIdComponent, objectId, LayerId.Object);
//   stateOld.set(ShouldSaveComponent, objectId, true);
//   stateOld.set(WorldIdComponent, objectId, stateOld.currentWorldId);
// }

// const OBJECT_PREFAB_FACTORY_MAP: Record<
//   EditorObjectPrefabs,
//   (cursoId: number) => number
// > = {
//   [EditorObjectPrefabs.WALL]: (cursorId: number) => {
//     const entityId = stateOld.addEntity();
//     createBaseObject(cursorId, entityId);
//     stateOld.set(BehaviorComponent, entityId, new WallBehavior(entityId));
//     stateOld.set(TextureIdComponent, entityId, ReservedEntity.WALL_IMAGE);
//     return entityId;
//   },
//   [EditorObjectPrefabs.CRATE]: (cursorId: number) => {
//     const entityId = stateOld.addEntity();
//     createBaseObject(cursorId, entityId);
//     stateOld.set(BehaviorComponent, entityId, new BoxBehavior(entityId));
//     stateOld.set(TextureIdComponent, entityId, ReservedEntity.CRATE_IMAGE);
//     return entityId;
//   },
//   // TODO this should be a spawn point, not a player
//   [EditorObjectPrefabs.PLAYER]: (cursorId: number) => {
//     const entityId = stateOld.addEntity();
//     createBaseObject(cursorId, entityId);
//     stateOld.set(BehaviorComponent, entityId, new PlayerBehavior(entityId));
//     stateOld.set(
//       TextureIdComponent,
//       entityId,
//       ReservedEntity.PLAYER_DOWN_IMAGE
//     );
//     return entityId;
//   },
//   [EditorObjectPrefabs.ZOMBIE]: (cursorId: number) => {
//     const entityId = stateOld.addEntity();
//     createBaseObject(cursorId, entityId);
//     stateOld.set(BehaviorComponent, entityId, new BroBehavior(entityId));
//     stateOld.set(
//       TextureIdComponent,
//       entityId,
//       ReservedEntity.ZOMBIE_SWAY_ANIMATION
//     );
//     return entityId;
//   }
// };

// function getEditorCursors(): ReadonlyArray<number> {
//   cursorIds.length = 0;
//   return cursorIds;
//   // return executeFilterQuery(
//   //   (entityId) => stateOld.isBehavior(entityId, CursorBehavior),
//   //   cursorIds,
//   //   stateOld.addedEntities
//   // );
// }

// function moveCursorByTiles(cursorId: number, dx: TilesX, dy: TilesY) {
//   const { x, y } = stateOld.get(PositionComponent, cursorId);
//   stateOld.copy(
//     PositionComponent,
//     cursorId,
//     _v3.set(
//       x + convertTilesXToPixels(dx),
//       y + convertTilesYToPixels(dy),
//       0
//     ) as Vector3<Px>
//   );
// }

// const slowThrottledMoveCursorByTiles = throttle(moveCursorByTiles, 350);
// const fastThrottledMoveCursorByTiles = throttle(moveCursorByTiles, 50);

// function enterNormalMode(cursorId: number) {
//   editorMode = EditorMode.NORMAL;
//   stateOld.set(
//     TextureIdComponent,
//     cursorId,
//     ReservedEntity.EDITOR_NORMAL_CURSOR_IMAGE
//   );
//   console.log("mode=Normal, layer=Object");
// }

// function enterReplaceMode(cursorId: number) {
//   editorMode = EditorMode.REPLACE;
//   stateOld.set(
//     TextureIdComponent,
//     cursorId,
//     ReservedEntity.EDITOR_REPLACE_CURSOR_IMAGE
//   );
//   console.log("mode=Replace, layer=Object");
//   console.log("press a key to place an object");
//   console.table(OBJECT_KEY_TABLE, OBJECT_KEY_COLUMNS);
// }

// function objectToTable<T extends Record<string, any>>(
//   object: T,
//   keyColumnLabel: string,
//   valueColumnLabel: string
// ): Array<{ [key: string]: any }> {
//   return Object.entries(object).map(([key, value]) => ({
//     [keyColumnLabel]: key,
//     [valueColumnLabel]: value
//   }));
// }

// const PositionedObjectsQuery = stateOld
//   .buildQuery({
//     all: [PositionComponent, LayerIdComponent]
//   })
//   .addParam("x", 0)
//   .addParam("y", 0)
//   .complete(({ entityId, x, y }) => {
//     // console.log(
//     //   entityId,
//     //   x,
//     //   y,
//     //   state.get(PositionComponent, entityId).toArray()
//     // );
//     return (
//       stateOld.is(
//         PositionComponent,
//         entityId,
//         _v3.set(x, y, 0) as Vector3<Px>
//       ) && stateOld.is(LayerIdComponent, entityId, LayerId.Object)
//     );
//   });

// function getEntityAt(x: Px, y: Px): number | undefined {
//   PositionedObjectsQuery.setParam("x", x).setParam("y", y);
//   return PositionedObjectsQuery().at(0);
// }

// // TODO not the best name..?
// function markForRemovalAt(x: Px, y: Px) {
//   const entityId = getEntityAt(x, y);
//   console.log("removing entity", entityId, "at", x, y);
//   if (entityId !== undefined) {
//     stateOld.set(
//       EntityFrameOperationComponent,
//       entityId,
//       EntityFrameOperation.REMOVE
//     );
//     if (stateOld.has(GuidComponent, entityId)) {
//       deleteEntity(stateOld.get(GuidComponent, entityId));
//     }
//   }
// }

// const inputQueue = createInputQueue();

// function recycleEntities() {
//   const { removedEntities } = stateOld;
//   for (const entityId of removedEntities) {
//     stateOld.recycleEntity(entityId);
//   }
// }

// export function OldEditorSystem() {
//   const cursorIds = getEditorCursors();
//   let cursorId: number;

//   if (cursorIds.length === 0) {
//     cursorId = stateOld.addEntity();
//     // stateOld.acquire(SpriteComponent, cursorId);
//     stateOld.set(
//       TextureIdComponent,
//       cursorId,
//       ReservedEntity.EDITOR_NORMAL_CURSOR_IMAGE
//     );
//     // stateOld.set(BehaviorComponent, cursorId, new CursorBehavior(cursorId));
//     stateOld.set(LayerIdComponent, cursorId, LayerId.UI);
//   } else {
//     cursorId = cursorIds[0];
//   }

//   // followEntityWithCamera(cursorId);
//   recycleEntities();

//   const newInputMaybe = inputQueue.shift();
//   if (newInputMaybe === undefined) {
//     slowThrottledMoveCursorByTiles.cancel();
//     return; ////////// EARLY RETURN //////////
//   }
//   const nextInput = newInputMaybe!;
//   const lastKeyDown = getLastKeyDown()!;

//   const { x: cursorX, y: cursorY } = stateOld.get(PositionComponent, cursorId);

//   switch (editorMode) {
//     case EditorMode.NORMAL:
//       if (nextInput in KEY_MAPS.MOVE) {
//         const throttledMoveCursorByTiles = isKeyRepeating(nextInput)
//           ? fastThrottledMoveCursorByTiles
//           : slowThrottledMoveCursorByTiles;
//         const [dx, dy] = KEY_MAPS.MOVE[nextInput as Key]!;
//         throttledMoveCursorByTiles(cursorId, dx as TilesX, dy);
//       }
//       if (nextInput === Key.r) {
//         enterReplaceMode(cursorId);
//       }

//       if (isKeyDown(Key.x)) {
//         markForRemovalAt(cursorX, cursorY);
//       }
//       if (isKeyDown(Key.g | Key.Shift)) {
//         const cursorTileX = convertPixelsToTilesX(cursorX);
//         const cursorTileY = convertPixelsToTilesY(cursorY);

//         for (
//           let tileX = cursorTileX - SCREEN_TILE / 2;
//           tileX < cursorTileX + SCREEN_TILE / 2;
//           tileX++
//         ) {
//           for (
//             let tileY = cursorTileY - SCREEN_TILE / 2;
//             tileY < cursorTileY + SCREEN_TILE / 2;
//             tileY++
//           ) {
//             OBJECT_PREFAB_FACTORY_MAP[EditorObjectPrefabs.WALL](cursorId);
//           }
//         }
//       }
//       break;
//     case EditorMode.REPLACE:
//       if (lastKeyDown === Key.Escape) {
//         enterNormalMode(cursorId);
//       }

//       if (OBJECT_KEYS.includes(lastKeyDown)) {
//         markForRemovalAt(cursorX, cursorY);
//         const objectPrefab = OBJECT_KEY_MAPS[lastKeyDown]!;
//         const id = OBJECT_PREFAB_FACTORY_MAP[objectPrefab](cursorId);
//         stateOld.postEntity(id);
//         enterNormalMode(cursorId);
//       }
//       break;
//   }
// }

// export function startEditorSystem() {
//   const cursorIds = getEditorCursors();
//   for (const cursorId of cursorIds) {
//     stateOld.set(IsVisibleComponent, cursorId, true);
//   }
// }

// export function stopEditorSystem() {
//   const cursorIds = getEditorCursors();
//   for (const cursorId of cursorIds) {
//     stateOld.set(IsVisibleComponent, cursorId, false);
//   }
// }

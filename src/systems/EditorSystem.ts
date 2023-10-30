import {EntityName, addEntity, getNamedEntity} from "../Entity";
import { and, executeFilterQuery } from "../Query";
import {ActLike, isActLike, setActLike} from "../components/ActLike";
import {isLookLike, setLookLike} from "../components/LookLike";
import {getPixiApp, setPixiApp} from "../components/PixiApp";
import {setPosition} from "../components/Position";

const cursorIds: number[] = [];

function getEditorCursors(): number[] {
  cursorIds.length = 0;
  return executeFilterQuery(and(
    (entityId) => isLookLike(entityId, getNamedEntity(EntityName.EDITOR_CURSOR_IMAGE)),
    (entityId) => isActLike(entityId, ActLike.EDITOR_CURSOR),
  ), cursorIds);
}

export function EditorSystem() {
  const cursorIds = getEditorCursors();
  if (cursorIds.length === 0) {
    const cursorId = addEntity();
    console.log("Creating cursor", cursorId);
    setLookLike(cursorId, getNamedEntity(EntityName.EDITOR_CURSOR_IMAGE));
    setActLike(cursorId, ActLike.EDITOR_CURSOR);
    setPosition(cursorId, 0, 0)
    const pixiApp = getPixiApp(getNamedEntity(EntityName.DEFAULT_PIXI_APP))
    setPixiApp(cursorId, pixiApp);
  }
}

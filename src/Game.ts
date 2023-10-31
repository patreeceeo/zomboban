import {EntityName, addEntity, setNamedEntity} from "./Entity";
import {handleKeyDown, handleKeyUp} from "./Input";
import {setLookLike} from "./components/LookLike";
import {setPixiApp} from "./components/PixiApp";
import {setPosition} from "./components/Position";
import {SPRITE_SIZE} from "./components/Sprite";
import {EditorSystem} from "./systems/EditorSystem";
import {LoadingSystem, queueImageLoading} from "./systems/LoadingSystem";
import {RenderSystem, mountPixiApp} from "./systems/RenderSystem";

if(module.hot) {
  module.hot.accept((getParents) => {
    return getParents();
  });
}

export function startLoadingGame(element: HTMLElement) {
  const floorImageId = addEntity();
  queueImageLoading(floorImageId, "assets/images/floor.gif")
  setNamedEntity(EntityName.FLOOR_IMAGE, floorImageId)

  const normalCursorImageId = addEntity();
  queueImageLoading(normalCursorImageId, "assets/images/normal_cursor.gif")
  setNamedEntity(EntityName.EDITOR_NORMAL_CURSOR_IMAGE, normalCursorImageId)

  const replaceCursorImageId = addEntity();
  queueImageLoading(replaceCursorImageId, "assets/images/replace_cursor.gif")
  setNamedEntity(EntityName.EDITOR_REPLACE_CURSOR_IMAGE, replaceCursorImageId)

  const app = mountPixiApp(element)
  const defaultPixiAppId = addEntity();
  setPixiApp(defaultPixiAppId, app)
  setNamedEntity(EntityName.DEFAULT_PIXI_APP, defaultPixiAppId)

  for(let y = 0; y < 16; y++) {
    for(let x = 0; x < 16; x++) {
      const entityId = addEntity();
      setPosition(entityId, x * SPRITE_SIZE, y * SPRITE_SIZE)
      setLookLike(entityId, floorImageId)
      setPixiApp(entityId, app)
    }
  }
}

const SYSTEM_INTERVALS: Array<NodeJS.Timeout> = [];

export function startGame() {
  SYSTEM_INTERVALS.push(setInterval(LoadingSystem, 100));

  SYSTEM_INTERVALS.push(setInterval(() => {
    RenderSystem();
    EditorSystem();
  } , 10));

  window.onkeydown = handleKeyDown;
  window.onkeyup = handleKeyUp;
}

export function stopGame() {
  SYSTEM_INTERVALS.forEach(clearInterval);
  SYSTEM_INTERVALS.length = 0;
}

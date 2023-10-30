import {EntityName, addEntity, setNamedEntity} from "./Entity";
import {handleKeyDown, handleKeyUp} from "./Input";
import {setLookLike} from "./components/LookLike";
import {setPixiApp} from "./components/PixiApp";
import {setPosition} from "./components/Position";
import {SPRITE_SIZE} from "./components/Sprite";
import {EditorSystem} from "./systems/EditorSystem";
import {LoadingSystem, queueImageLoading} from "./systems/LoadingSystem";
import {RenderSystem, mountPixiApp} from "./systems/RenderSystem";

export function startGame(element: HTMLElement) {

  setInterval(LoadingSystem, 100);

  const floorImageId = addEntity();
  queueImageLoading(floorImageId, "assets/images/floor.gif")
  setNamedEntity(EntityName.FLOOR_IMAGE, floorImageId)

  const cursorImageId = addEntity();
  queueImageLoading(cursorImageId, "assets/images/cursor.gif")
  setNamedEntity(EntityName.EDITOR_CURSOR_IMAGE, cursorImageId)

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

  window.onkeydown = handleKeyDown;
  window.onkeyup = handleKeyUp;

  setInterval(() => {
    RenderSystem();
    EditorSystem();
  } , 10);
}

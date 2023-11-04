import {EntityName, addEntity, getNamedEntity, setNamedEntity} from "./Entity";
import {startGame} from "./Game";
import {handleKeyDown, handleKeyUp} from "./Input";
import {Layer, setLayer} from "./components/Layer";
import {setLookLike} from "./components/LookLike";
import {setPixiApp} from "./components/PixiApp";
import {setPosition} from "./components/Position";
import {SPRITE_SIZE} from "./components/Sprite";
import {NAMED_ENTITY_IMAGES} from "./constants";
import {batchQueueImageLoadingAsNamedEntity} from "./functions/ImageLoading";
import {EditorSystem} from "./systems/EditorSystem";
import {LoadingSystem} from "./systems/LoadingSystem";
import {RenderSystem, mountPixiApp} from "./systems/RenderSystem";

if(module.hot) {
  module.hot.accept((getParents) => {
    return getParents();
  });
}

export function startLoadingEditor(element: HTMLElement) {
  batchQueueImageLoadingAsNamedEntity(NAMED_ENTITY_IMAGES)

  const app = mountPixiApp(element)
  const defaultPixiAppId = addEntity();
  setPixiApp(defaultPixiAppId, app)
  setNamedEntity(EntityName.DEFAULT_PIXI_APP, defaultPixiAppId)

  for(let y = 0; y < 24; y++) {
    for(let x = 0; x < 24; x++) {
      const entityId = addEntity();
      setPosition(entityId, x * SPRITE_SIZE, y * SPRITE_SIZE)
      setLookLike(entityId, getNamedEntity(EntityName.FLOOR_IMAGE))
      setPixiApp(entityId, app)
      setLayer(entityId, Layer.BACKGROUND)
    }
  }
}

const SYSTEM_INTERVALS: Array<NodeJS.Timeout> = [];

export function startEditor() {
  SYSTEM_INTERVALS.push(setInterval(LoadingSystem, 100));

  SYSTEM_INTERVALS.push(setInterval(() => {
    if(!EditorSystem()) {
      stopEditor();
      startGame();
    }
    RenderSystem();
  } , 10));

  window.onkeydown = handleKeyDown;
  window.onkeyup = handleKeyUp;
}

export function stopEditor() {
  SYSTEM_INTERVALS.forEach(clearInterval);
  SYSTEM_INTERVALS.length = 0;
}

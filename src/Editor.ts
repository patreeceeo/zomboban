import {EntityName, addEntity, getNamedEntity, setNamedEntity} from "./Entity";
import {handleKeyDown, handleKeyUp} from "./Input";
import {Layer, setLayer} from "./components/Layer";
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
function queueImageLoadingAsNamedEntity(name: EntityName, url: string) {
  const imageId = addEntity();
  queueImageLoading(imageId, url)
  setNamedEntity(name, imageId)
}

const NAMED_ENTITY_IMAGES: Partial<Record<EntityName, string>> = {
  [EntityName.FLOOR_IMAGE]: "assets/images/floor.gif",
  [EntityName.WALL_IMAGE]: "assets/images/wall.gif",
  [EntityName.CRATE_IMAGE]: "assets/images/crate.gif",
  [EntityName.PLAYER_DOWN_IMAGE]: "assets/images/player_down.gif",
  [EntityName.EDITOR_NORMAL_CURSOR_IMAGE]: "assets/images/normal_cursor.gif",
  [EntityName.EDITOR_REPLACE_CURSOR_IMAGE]: "assets/images/replace_cursor.gif",
}

export function startLoadingEditor(element: HTMLElement) {
  for(const [name, url] of Object.entries(NAMED_ENTITY_IMAGES)) {
    queueImageLoadingAsNamedEntity(name as EntityName, url)
  }

  const app = mountPixiApp(element)
  const defaultPixiAppId = addEntity();
  setPixiApp(defaultPixiAppId, app)
  setNamedEntity(EntityName.DEFAULT_PIXI_APP, defaultPixiAppId)

  for(let y = 0; y < 16; y++) {
    for(let x = 0; x < 16; x++) {
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
    RenderSystem();
    EditorSystem();
  } , 10));

  window.onkeydown = handleKeyDown;
  window.onkeyup = handleKeyUp;
}

export function stopEditor() {
  SYSTEM_INTERVALS.forEach(clearInterval);
  SYSTEM_INTERVALS.length = 0;
}

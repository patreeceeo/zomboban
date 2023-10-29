import {addEntity} from "./Entity";
import {setLookLike} from "./components/LookLike";
import {setPixiApp} from "./components/PixiApp";
import {setPosition} from "./components/Position";
import {LoadingSystem, queueImageLoading} from "./systems/LoadingSystem";
import {RenderSystem, mountPixiApp} from "./systems/RenderSystem";

export function startGame(element: HTMLElement) {

  const executeLoadingSystem = LoadingSystem().execute;
  const executeRenderSystem = RenderSystem().execute;
  setInterval(executeLoadingSystem, 100);
  setInterval(executeRenderSystem, 0);

  const floorImageId = addEntity();
  queueImageLoading(floorImageId, "assets/images/floor.gif")

  const app = mountPixiApp(element)

  for(let y = 0; y < 16; y++) {
    for(let x = 0; x < 16; x++) {
      const entityId = addEntity();
      setPosition(entityId, x, y)
      setLookLike(entityId, floorImageId)
      setPixiApp(entityId, app)
    }
  }
}

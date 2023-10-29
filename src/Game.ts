import {addEntity} from "./Entity";
import {setLookLike} from "./components/LookLike";
import {setPosition} from "./components/Position";
import {setRenderLayer} from "./components/RenderLayer";
import {LoadingSystem, queueImageLoading} from "./systems/LoadingSystem";
import {RenderSystem, addRenderLayer} from "./systems/RenderSystem";

export function startGame(element: HTMLElement) {

  const executeLoadingSystem = LoadingSystem().execute;
  setInterval(executeLoadingSystem, 10);

  const executeRenderSystem = RenderSystem().execute;
  const render = () => {
    executeRenderSystem();
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);

  const backgroundLayerId = addEntity();
  addRenderLayer(backgroundLayerId, element)

  const floorImageId = addEntity();
  queueImageLoading(floorImageId, "assets/images/floor.gif")

  for(let y = 0; y < 16; y++) {
    for(let x = 0; x < 16; x++) {
      const entityId = addEntity();
      setPosition(entityId, x, y)
      setLookLike(entityId, floorImageId)
      setRenderLayer(entityId, backgroundLayerId)
    }
  }
}

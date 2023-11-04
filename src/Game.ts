import { handleKeyDown, handleKeyUp } from "./Input";
import { LoadingSystem } from "./systems/LoadingSystem";
import { RenderSystem } from "./systems/RenderSystem";

if (module.hot) {
  module.hot.accept((getParents) => {
    return getParents();
  });
}

const SYSTEM_INTERVALS: Array<NodeJS.Timeout> = [];

export function startGame() {
  SYSTEM_INTERVALS.push(setInterval(LoadingSystem, 100));

  SYSTEM_INTERVALS.push(
    setInterval(() => {
      RenderSystem();
    }, 10)
  );

  window.onkeydown = handleKeyDown;
  window.onkeyup = handleKeyUp;
}

export function stopGame() {
  SYSTEM_INTERVALS.forEach(clearInterval);
  SYSTEM_INTERVALS.length = 0;
}

import { mountRouter, route, startLoading } from "./Router";
import { afterDOMContentLoaded } from "./util";
import { handleKeyDown, handleKeyUp } from "./Input";
import { startFrameRhythm } from "./Rhythm";
import { setCurrentLevelId } from "./state/CurrentLevel";
// TODO incorporate some stuff from the game jam game
// - log functions
// - rename setPosition<X/Y> to set<X/Y> etc
// - rename setVelocity<X/Y> to set<DX/DY> etc

startLoading();
startFrameRhythm();

function addEventListers() {
  window.onkeydown = handleKeyDown;
  window.onkeyup = handleKeyUp;
  window.onhashchange = route;
  afterDOMContentLoaded(handleDomLoaded);
}

async function handleDomLoaded() {
  await mountRouter(document.getElementById("game")!);
  await setCurrentLevelId(0);
  route();
}

if (import.meta.hot) {
  import.meta.hot.on("vite:error", (err) => {
    console.error(err);
  });
  import.meta.hot.dispose(() => {
    import.meta.hot!.data.loaded = true;
  });
  import.meta.hot.accept(() => {});
  if (!import.meta.hot!.data.loaded) {
    addEventListers();
  }
} else {
  addEventListers();
}

import { route, startLoading } from "./Router";
import { afterDOMContentLoaded } from "./util";
import { handleKeyDown, handleKeyUp } from "./Input";
import { state } from "./state";

startLoading();

function addEventListers() {
  window.onkeydown = handleKeyDown;
  window.onkeyup = handleKeyUp;
  window.onhashchange = route;
  afterDOMContentLoaded(handleDomLoaded);
}

function handleDomLoaded() {
  state.mountPixiApp(document.getElementById("game")!);
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

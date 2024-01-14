import { startApp, startLoading } from "./App";
import { afterDOMContentLoaded } from "./util";

if (import.meta.hot) {
  import.meta.hot.on("vite:error", (err) => {
    console.error(err);
  });
  import.meta.hot.dispose(() => {
    import.meta.hot!.data.loaded = true;
  });
  import.meta.hot.accept(() => {});
  if (!import.meta.hot!.data.loaded) {
    afterDOMContentLoaded(() => {
      startLoading(document.getElementById("game")!);
      startApp();
    });
  }
} else {
  afterDOMContentLoaded(() => {
    startLoading(document.getElementById("game")!);
    startApp();
  });
}

import { startApp, startLoading } from "./App";
import { afterDOMContentLoaded } from "./util";

startLoading(document.getElementById("game")!);

if (import.meta.hot) {
  import.meta.hot.on("vite:error", (err) => {
    console.error(err);
  });
  import.meta.hot.dispose(() => {
    import.meta.hot!.data.loaded = true;
  });
  import.meta.hot.accept(() => {});
  if (!import.meta.hot!.data.loaded) {
    afterDOMContentLoaded(startApp);
  }
} else {
  afterDOMContentLoaded(startApp);
}

import { startApp, startLoading } from "./App";
import { afterDOMContentLoaded } from "./util";

afterDOMContentLoaded(() => {
  startLoading(document.getElementById("game")!);
  startApp();
});

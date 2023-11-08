import { startApp, startLoading, stopApp } from "./App";
import { afterDOMContentLoaded } from "./util";

let _started = false;

if (module.hot) {
  module.hot.dispose(() => {
    stopApp();
  });
  module.hot.accept(() => {
    _started = true;
    startApp();
  });
  setTimeout(() => {
    if (!_started) {
      start();
    }
  });
} else {
  start();
}

function start() {
  afterDOMContentLoaded(() => {
    startLoading(document.getElementById("game")!);
    startApp();
  });
}

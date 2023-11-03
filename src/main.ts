import {startEditor, startLoadingEditor, stopEditor} from "./Editor";
import {afterDOMContentLoaded} from "./util";

let _started = false;

if(module.hot) {
  module.hot.dispose(() => {
    stopEditor();
  });
  module.hot.accept(() => {
    _started = true;
    startEditor();
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
    startLoadingEditor(document.getElementById("game")!);
    startEditor();
  });
}



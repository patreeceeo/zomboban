import {startGame, startLoadingGame, stopGame} from "./Game";
import {afterDOMContentLoaded} from "./util";

let _started = false;

if(module.hot) {
  module.hot.dispose(() => {
    stopGame();
  });
  module.hot.accept(() => {
    _started = true;
    startGame();
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
    startLoadingGame(document.getElementById("game")!);
    startGame();
  });
}



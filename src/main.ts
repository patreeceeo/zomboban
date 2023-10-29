import {startGame} from "./Game";
import {afterDOMContentLoaded} from "./util";

if (module.hot) {
  module.hot.accept(() => {
    window.location.reload();
  });
}


afterDOMContentLoaded(() => {
  startGame(document.getElementById("game")!);
});

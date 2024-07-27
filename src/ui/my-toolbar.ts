import { IslandController } from "../Zui/Island";
import { withHMR } from "../Zui/HMR";
import { pauseEvent, playEvent, restartGameEvent, rewindEvent } from "./events";
import { handleShowMenu } from "../inputs";

class Scope {
  isSignedIn = false;
  isPaused = false;
  handlePressReset(event: MouseEvent) {
    restartGameEvent.map(event);
  }
  handlePressRewind(event: MouseEvent) {
    rewindEvent.map(event);
  }
  handlePressPlay(event: MouseEvent) {
    playEvent.map(event);
  }
  handlePressPause(event: MouseEvent) {
    pauseEvent.map(event);
  }
  handlePressMenu() {
    handleShowMenu();
  }
}

class Props {
  "is-signed-in" = false;
  "is-paused" = false;
}

class Toolbar extends IslandController<Scope, Props> {
  scope = new Scope();
  props = new Props();
  constructor(root: HTMLElement) {
    super(root);
  }

  updateScope(props: Props) {
    const { scope } = this;
    scope.isSignedIn = props["is-signed-in"];
    scope.isPaused = props["is-paused"];
  }

  unmount() {}
}

let defaultExport = Toolbar;

if (import.meta.hot) {
  const { Clazz, accept } = withHMR(defaultExport);
  defaultExport = Clazz as IConstructor<Toolbar>;
  import.meta.hot.accept(accept);
}

export default defaultExport;

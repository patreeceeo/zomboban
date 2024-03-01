import { Scene } from "../Scene";
import { ReservedEntity } from "../entities";
import { LoadingService } from "../services/LoadingService";
import { stateOld } from "../state";
import { EntityOperationSystem } from "../systems/EntityOperationSystem";
import {
  LoadingState,
  LoadingStateComponent
} from "../components/LoadingState";

// const MENU_ITEMS = [
//   {
//     label: "level 1",
//     onSelect: async () => {
//       routeTo(RouteId.GAME, { world: 0 });
//     },
//   },
//   {
//     label: "level 2",
//     onSelect: async () => {
//       routeTo(RouteId.GAME, { world: 1 });
//     },
//   },
// ];

export default class MenuScene implements Scene {
  #hasLoaded = false;
  // #inputQueue = createInputQueue();
  constructor() {}
  start() {}
  update = () => {
    // const inputQueue = this.#inputQueue;
    if (
      stateOld.is(
        LoadingStateComponent,
        ReservedEntity.GUI_BUTTON_IMAGE,
        LoadingState.Completed
      ) &&
      stateOld.is(
        LoadingStateComponent,
        ReservedEntity.HAND_CURSOR_IMAGE,
        LoadingState.Completed
      ) &&
      !this.#hasLoaded
    ) {
      // const buttonTexture = state.get(
      //   ImageComponent,
      //   ReservedEntity.GUI_BUTTON_IMAGE,
      // ).texture!;
      // const cursorTexture = state.get(
      //   ImageComponent,
      //   ReservedEntity.HAND_CURSOR_IMAGE,
      // ).texture!;
      // const buttons = MENU_ITEMS.map(({ label, onSelect }) => {
      //   const button = new Button(new ButtonStyle({ label }));
      //   button.style.texture = buttonTexture;
      //   button.onPress.connect(onSelect);
      //   return button;
      // });
      // const cursor = new Sprite(cursorTexture);
      // cursor.anchor.set(0.01);
      // menu.addItem(...buttons);
      // menu.focusSprite = cursor;
      // this.#hasLoaded = true;
      // state.pixiApp.stage.addChild(menu);
      // }
      // if (inputQueue.length > 0) {
      //   const input = inputQueue.shift()!;
      //   if (input in KEY_MAPS.MOVE) {
      //     menu.focusIndex += KEY_MAPS.MOVE[input as Key]![1];
      //   } else if (menu.focusSprite?.visible) {
      //     MENU_ITEMS[menu.focusIndex].onSelect();
      //   }
    }
    EntityOperationSystem();
  };
  stop() {
    // state.pixiApp.stage.removeChild(this.#menu);
  }
  services = [LoadingService];
}

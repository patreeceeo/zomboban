import { ActionSystem } from "./systems/ActionSystem";
import { AnimationSystem } from "./systems/AnimationSystem";
import { BehaviorSystem } from "./systems/BehaviorSystem";
import { CameraSystem } from "./systems/CameraSystem";
import { ClientSystem } from "./systems/ClientSystem";
import { LogSystem } from "./systems/LogSystem";
import { EditorSystem } from "./systems/EditorSystem";
import { GameSystem } from "./systems/GameSystem";
import { InputSystem } from "./systems/InputSystem";
import { ModelSystem } from "./systems/ModelSystem";
import { RenderSystem } from "./systems/RenderSystem";
import { IRouteRecord, routeTo } from "./systems/RouterSystem";
import { TileSystem } from "./systems/TileSystem";
import { ActionDebugSystem } from "./systems/ActionDebugSystem";
import { Menu, MenuItem, createMenuSystem } from "./systems/MenuSystem";

const BASIC_SYSTEMS = [
  TileSystem,
  BehaviorSystem,
  ActionSystem,
  ModelSystem,
  AnimationSystem,
  CameraSystem,
  RenderSystem,
  ClientSystem,
  InputSystem,
  LogSystem,
  ActionDebugSystem
];

export const ROUTES: IRouteRecord = {
  game: new Set([...BASIC_SYSTEMS, GameSystem]),
  editor: new Set([...BASIC_SYSTEMS, EditorSystem]),
  pauseMenu: new Set([
    RenderSystem,
    /* Needed for the GlobalInputEntity */
    BehaviorSystem,
    /* Needed for the GlobalInputEntity */
    ActionSystem,
    createMenuSystem(
      new Menu("Game Paused", [
        new MenuItem("How to Play", () => routeTo("howToPlay")),
        new MenuItem("Feedback", () => {
          routeTo("feedback");
        }),
        new MenuItem("Share", () => {
          routeTo("share");
        }),
        new MenuItem("Return to Game", () => routeTo("game"))
      ])
    ),
    InputSystem
  ]),
  feedback: new Set([
    RenderSystem,
    /* Needed for the GlobalInputEntity */
    BehaviorSystem,
    /* Needed for the GlobalInputEntity */
    ActionSystem,
    createMenuSystem(
      new Menu("", [
        new MenuItem("<lit-feedback-form/>"),
        new MenuItem("Return to Game", () => routeTo("game"))
      ])
    ),
    InputSystem
  ]),
  howToPlay: new Set([
    RenderSystem,
    /* Needed for the GlobalInputEntity */
    BehaviorSystem,
    /* Needed for the GlobalInputEntity */
    ActionSystem,
    createMenuSystem(
      new Menu("How to Play", [
        new MenuItem(
          "Try to get the rooster. Yellow blocks can be pushed, but be careful to not get stuck!"
        ),
        new MenuItem("Controls:"),
        new MenuItem("WASD to move"),
        new MenuItem("Z to undo"),
        new MenuItem("Shift+R to restart"),
        new MenuItem("mouse wheel to zoom"),
        new MenuItem("ESC to toggle this menu"),
        new MenuItem("Back", () => routeTo("pauseMenu"))
      ])
    ),
    InputSystem
  ]),
  share: new Set([
    RenderSystem,
    /* Needed for the GlobalInputEntity */
    BehaviorSystem,
    /* Needed for the GlobalInputEntity */
    ActionSystem,
    createMenuSystem(
      new Menu("Share", [
        new MenuItem(`<img src='/game/assets/images/shareqrcode.png'/>`),
        new MenuItem("Back", () => routeTo("pauseMenu"))
      ])
    )
  ])
};

export type RouteId = keyof typeof ROUTES;

export const DEFAULT_ROUTE: RouteId = "game";

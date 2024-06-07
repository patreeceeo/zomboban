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
      new Menu("Feedback", [
        new MenuItem("<lit-feedback-form/>"),
        new MenuItem("Back", () => routeTo("pauseMenu"))
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
        new MenuItem("Watch out for monsters, try to get the rooster."),
        new MenuItem("Controls:"),
        new MenuItem("WASD to move"),
        new MenuItem("Z to undo"),
        new MenuItem("mouse wheel to zoom"),
        new MenuItem("SPACE to toggle the editor"),
        new MenuItem("R to replace (in editor)"),
        new MenuItem("W to choose a wall (when replacing)"),
        new MenuItem("P to choose a player (when replacing)"),
        new MenuItem("M to choose a monster (when replacing)"),
        new MenuItem("F to choose a rooster (when replacing)"),
        new MenuItem("B to choose a block (when replacing)"),
        new MenuItem("ESC to toggle this menu"),
        new MenuItem("Back", () => routeTo("pauseMenu"))
      ])
    ),
    InputSystem
  ])
};

export type RouteId = keyof typeof ROUTES;

export const DEFAULT_ROUTE: RouteId = "game";

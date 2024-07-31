import { IRouteRecord } from "./systems/RouterSystem";
import { SystemEnum } from "./systems";
import { Route } from "./Route";

const BASIC_SYSTEMS = [
  SystemEnum.Tile,
  SystemEnum.Behavior,
  SystemEnum.Action,
  SystemEnum.Model,
  SystemEnum.Animation,
  SystemEnum.Camera,
  SystemEnum.Render,
  SystemEnum.Client,
  SystemEnum.Input
];

export const gameRoute = new Route("game");
export const editorRoute = new Route("editor");
export const menuRoute = new Route("menu");
export const helpRoute = new Route("help");

export const ROUTES: IRouteRecord = {
  [gameRoute.path]: new Set([...BASIC_SYSTEMS, SystemEnum.Game]),
  [editorRoute.path]: new Set([...BASIC_SYSTEMS, SystemEnum.Editor]),
  [menuRoute.path]: new Set([]),
  [helpRoute.path]: new Set([])
  // pauseMenu: new Set([
  // SystemEnum.Render,
  /* Needed for the GlobalInputEntity */
  // SystemEnum.Behavior,
  /* Needed for the GlobalInputEntity */
  // SystemEnum.Action,
  // createMenuSystem(
  //   new Menu("Game Paused", [
  //     new MenuItem("How to Play", () => routeTo("howToPlay")),
  //     new MenuItem("Feedback", () => {
  //       routeTo("feedback");
  //     }),
  //     new MenuItem("Share", () => {
  //       routeTo("share");
  //     }),
  //     new MenuItem("Return to Game", () => routeTo("game"))
  //   ])
  // ),
  // SystemEnum.Input
  // ]),
  // feedback: new Set([
  //   SystemEnum.Render,
  //   /* Needed for the GlobalInputEntity */
  //   SystemEnum.Behavior,
  //   /* Needed for the GlobalInputEntity */
  //   SystemEnum.Action,
  //   // createMenuSystem(
  //   //   new Menu("", [
  //   //     new MenuItem("<lit-feedback-form/>"),
  //   //     new MenuItem("Return to Game", () => routeTo("game"))
  //   //   ])
  //   // ),
  //   SystemEnum.Input
  // ]),
  // howToPlay: new Set([
  //   SystemEnum.Render,
  //   /* Needed for the GlobalInputEntity */
  //   SystemEnum.Behavior,
  //   /* Needed for the GlobalInputEntity */
  //   SystemEnum.Action,
  //   // createMenuSystem(
  //   //   new Menu("How to Play", [
  //   //     new MenuItem(
  //   //       "Try to get the rooster. Yellow blocks can be pushed, but be careful to not get stuck!"
  //   //     ),
  //   //     new MenuItem("Controls:"),
  //   //     new MenuItem("WASD to move"),
  //   //     new MenuItem("Z to undo"),
  //   //     new MenuItem("Shift+R to restart"),
  //   //     new MenuItem("mouse wheel to zoom"),
  //   //     new MenuItem("ESC to toggle this menu"),
  //   //     new MenuItem("Back", () => routeTo("pauseMenu"))
  //   //   ])
  //   // ),
  //   SystemEnum.Input
  // ]),
  // share: new Set([
  //   SystemEnum.Render,
  //   /* Needed for the GlobalInputEntity */
  //   SystemEnum.Behavior,
  //   /* Needed for the GlobalInputEntity */
  //   SystemEnum.Action
  //   // createMenuSystem(
  //   //   new Menu("Share", [
  //   //     new MenuItem(`<img src='/game/assets/images/shareqrcode.png'/>`),
  //   //     new MenuItem("Back", () => routeTo("pauseMenu"))
  //   //   ])
  //   // )
  // ])
};

export type RouteId = keyof typeof ROUTES;

export const DEFAULT_ROUTE: RouteId = "game";

import { ISystemConstructor } from "../System";

export enum SystemEnum {
  Loading,
  SceneManager,
  Action,
  Animation,
  Behavior,
  Camera,
  Editor,
  Game,
  Input,
  Model,
  Render,
  Tile
}

export class SystemRegistery extends Map<SystemEnum, ISystemConstructor<any>> {}

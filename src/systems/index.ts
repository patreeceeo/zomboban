import { ISystemConstructor } from "../System";

export enum SystemEnum {
  Loading,
  SceneManager,
  Action,
  Animation,
  Behavior,
  Editor,
  Game,
  Input,
  Model,
  Render,
  Tile
}

export class SystemRegistery extends Map<SystemEnum, ISystemConstructor<any>> {}

import { ISystemConstructor } from "../System";

export enum SystemEnum {
  Action,
  Animation,
  Behavior,
  Camera,
  Client,
  Editor,
  Game,
  Input,
  Model,
  Render,
  Tile
}

export class SystemRegistery extends Map<SystemEnum, ISystemConstructor<any>> {}

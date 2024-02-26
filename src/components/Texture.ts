import { PrimativeArrayComponent } from "../Component";
import { Texture } from "three";

export class TextureComponent extends PrimativeArrayComponent<Texture> {
  constructor() {
    super([]);
  }
}

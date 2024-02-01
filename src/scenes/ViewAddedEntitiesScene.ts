import { Text } from "pixi.js";
import { listEntities } from "../Entity";
import { Scene } from "../Scene";

export default class ViewAddedEntitiesScene implements Scene {
  start() {
    let i = 0;
    for (const entityId of listEntities()) {
      const text = new Text(entityId);
      text.x = 16 * i;
      i++;
    }
  }
  update() {}
  stop() {}
  services = [];
}

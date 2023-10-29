import { Application, Sprite } from "pixi.js";
import {
  executeFilterQuery,
} from "../Query";
import { getImage } from "../components/Image";
import { getIsLoading, hasIsLoading } from "../components/IsLoading";
import { getLookLike, hasLookLike } from "../components/LookLike";
import { getPositionX } from "../components/PositionX";
import { getPositionY } from "../components/PositionY";
import { hasSprite, setSprite } from "../components/Sprite";
import { getPixiApp } from "../components/PixiApp";

const WIDTH = 800;
const HEIGHT = 600;
const SPRITE_WIDTH = 32;
const SPRITE_HEIGHT = 32;

let _isDirty = false;

export function RenderSystem() {
  const spriteIds: number[] = [];
  function getEntitiesNeedingSprites(): number[] {
    spriteIds.length = 0;
    return executeFilterQuery((entityId) => {
      if (hasLookLike(entityId)) {
        const imageId = getLookLike(entityId);
        return (
          hasIsLoading(imageId) &&
          !getIsLoading(imageId) &&
          !hasSprite(entityId)
        );
      }
      return false;
    }, spriteIds);
  }

  return {
    execute() {
      if (!_isDirty) return;

      for (const spriteId of getEntitiesNeedingSprites()) {
        const image = getImage(getLookLike(spriteId));
        const sprite = new Sprite(image.texture!);
        const app = getPixiApp(spriteId);
        sprite.x = getPositionX(spriteId) * SPRITE_WIDTH;
        sprite.y = getPositionY(spriteId) * SPRITE_HEIGHT;
        sprite.width = SPRITE_WIDTH;
        sprite.height = SPRITE_HEIGHT;
        app.stage.addChild(sprite);
        setSprite(spriteId, sprite);
      }
    },
  };
}

export function setDirty() {
  _isDirty = true;
}

export function mountPixiApp(parent: HTMLElement): Application {
  const app = new Application({
    width: WIDTH,
    height: HEIGHT,
  });
  parent.appendChild(app.view as any);
  return app;
}

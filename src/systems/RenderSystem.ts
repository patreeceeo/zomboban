import { Application, Sprite } from "pixi.js";
import { and, executeFilterQuery } from "../Query";
import { getImage, hasImage } from "../components/Image";
import { getLookLike, hasLookLike } from "../components/LookLike";
import { getPositionX, hasPositionX } from "../components/PositionX";
import { getPositionY, hasPositionY } from "../components/PositionY";
import { SPRITE_SIZE, getSprite, hasSprite, setSprite } from "../components/Sprite";
import { getPixiApp } from "../components/PixiApp";
import { hasLoadingCompleted } from "../components/LoadingState";

const WIDTH = 800;
const HEIGHT = 600;

let _isDirty = false;

const spriteIds: number[] = [];

function getEntitiesNeedingSprites(): number[] {
  spriteIds.length = 0;
  return executeFilterQuery((entityId) => {
    if (hasLookLike(entityId)) {
      const imageId = getLookLike(entityId);
      return hasLoadingCompleted(imageId) && !hasSprite(entityId);
    }
    return false;
  }, spriteIds);
}

function getSpriteEntities(): number[] {
  spriteIds.length = 0;
  return executeFilterQuery(and(hasSprite, hasPositionX, hasPositionY, hasLookLike), spriteIds);
}

export function RenderSystem() {
  if (!_isDirty) return;

  for (const spriteId of getEntitiesNeedingSprites()) {
    const image = getImage(getLookLike(spriteId));
    const sprite = new Sprite(image.texture!);
    const app = getPixiApp(spriteId);
    sprite.x = getPositionX(spriteId);
    sprite.y = getPositionY(spriteId);
    sprite.width = SPRITE_SIZE;
    sprite.height = SPRITE_SIZE;
    app.stage.addChild(sprite);
    setSprite(spriteId, sprite);
  }

  for (const spriteId of getSpriteEntities()) {
    const sprite = getSprite(spriteId);
    sprite.x = getPositionX(spriteId);
    sprite.y = getPositionY(spriteId);
    sprite.texture = getImage(getLookLike(spriteId)).texture!;
  }
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

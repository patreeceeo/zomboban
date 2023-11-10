import { Application, Sprite, ParticleContainer } from "pixi.js";
import { and, executeFilterQuery } from "../Query";
import { getImage } from "../components/Image";
import { getLookLike, hasLookLike } from "../components/LookLike";
import { getPositionX, hasPositionX } from "../components/PositionX";
import { getPositionY, hasPositionY } from "../components/PositionY";
import {
  SPRITE_SIZE,
  getSprite,
  hasSprite,
  setSprite,
} from "../components/Sprite";
import { getPixiAppId } from "../components/PixiAppId";
import { hasLoadingCompleted } from "../components/LoadingState";
import { Layer, getLayer, hasLayer } from "../components/Layer";
import { getIsVisible, hasIsVisible } from "../components/IsVisible";
import { getPixiApp } from "../components/PixiApp";

const WIDTH = 768;
const HEIGHT = 768;

let _isDirty = false;

const spriteIds: number[] = [];

const LAYER_PARTICLE_CONTAINER_MAP = new WeakMap<
  Application,
  Record<Layer, Array<ParticleContainer>>
>();

function createParticleContainer(zIndex: number): ParticleContainer {
  const container = new ParticleContainer(1024, {
    scale: true,
    position: true,
    rotation: true,
    uvs: true,
    alpha: true,
  });
  container.zIndex = zIndex;
  return container;
}

function createLayerParticleContainers(): Record<
  Layer,
  Array<ParticleContainer>
> {
  return {
    [Layer.BACKGROUND]: [],
    [Layer.OBJECT]: [],
    [Layer.USER_INTERFACE]: [],
  };
}

function getParticleContainers(
  app: Application,
  spriteId: number,
): ParticleContainer | undefined {
  const containers =
    LAYER_PARTICLE_CONTAINER_MAP.get(app)![
      hasLayer(spriteId) ? getLayer(spriteId) : Layer.BACKGROUND
    ];
  const imageId = getLookLike(spriteId);
  return containers[imageId];
}

function getEntitiesNeedingSprites(): ReadonlyArray<number> {
  spriteIds.length = 0;
  return executeFilterQuery((entityId) => {
    if (hasLookLike(entityId)) {
      const imageId = getLookLike(entityId);
      return hasLoadingCompleted(imageId) && !hasSprite(entityId);
    }
    return false;
  }, spriteIds);
}

function getSpriteEntities(): ReadonlyArray<number> {
  spriteIds.length = 0;
  return executeFilterQuery(
    and(hasSprite, hasPositionX, hasPositionY, hasLookLike),
    spriteIds,
  );
}

export function RenderSystem() {
  if (!_isDirty) return;

  for (const spriteId of getEntitiesNeedingSprites()) {
    const image = getImage(getLookLike(spriteId));
    const sprite = new Sprite(image.texture!);
    const app = getPixiApp(getPixiAppId(spriteId));
    sprite.x = getPositionX(spriteId);
    sprite.y = getPositionY(spriteId);
    sprite.width = SPRITE_SIZE;
    sprite.height = SPRITE_SIZE;
    const containers =
      LAYER_PARTICLE_CONTAINER_MAP.get(app)![
        hasLayer(spriteId) ? getLayer(spriteId) : Layer.BACKGROUND
      ];
    const imageId = getLookLike(spriteId);
    if (!containers[imageId]) {
      containers[imageId] = createParticleContainer(
        hasLayer(spriteId) ? getLayer(spriteId) : Layer.BACKGROUND,
      );
      app.stage.addChild(containers[imageId]);
    }
    containers[imageId].addChild(sprite);
    setSprite(spriteId, sprite);
  }

  for (const spriteId of getSpriteEntities()) {
    const sprite = getSprite(spriteId);
    const app = getPixiApp(getPixiAppId(spriteId));
    const container = getParticleContainers(app, spriteId);
    sprite.x = getPositionX(spriteId);
    sprite.y = getPositionY(spriteId);
    sprite.texture = getImage(getLookLike(spriteId)).texture!;
    const isVisible = hasIsVisible(spriteId) ? getIsVisible(spriteId) : true;
    // TODO(Patrick): possible bug in pixi https://github.com/pixijs/pixijs/issues/9845
    if (container) {
      if (!isVisible) {
        container.removeChild(sprite);
      } else {
        container.addChild(sprite);
      }
    } else {
      sprite.visible = isVisible;
    }
  }
  _isDirty = false;
}

export function setRenderStateDirty() {
  _isDirty = true;
}

export function mountPixiApp(parent: HTMLElement): Application {
  const app = new Application({
    width: WIDTH,
    height: HEIGHT,
  });
  app.stage.sortableChildren = true;
  const container = createLayerParticleContainers();
  LAYER_PARTICLE_CONTAINER_MAP.set(app, container);
  parent.appendChild(app.view as any);
  return app;
}

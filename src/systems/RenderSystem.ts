import { Application, Sprite, ParticleContainer, Container } from "pixi.js";
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
import { Layer, getLayer } from "../components/Layer";
import { getIsVisible, hasIsVisible } from "../components/IsVisible";
import { getPixiApp } from "../components/PixiApp";
import { isToBeRemoved } from "../components/ToBeRemoved";
import {
  SCREEN_PX,
  SCREEN_TILE,
  TILE_PX,
  convertPixelsToTiles,
  convertTilesToPixels,
} from "../units/convert";

const WIDTH = SCREEN_PX;
const HEIGHT = SCREEN_PX;

let _isDirty = false;

const spriteIds: number[] = [];

const LAYER_CONTAINER_MAP = new WeakMap<
  Application,
  Record<Layer, Container>
>();

const LAYER_TILEY_TEXTURE_CONTAINER_MAP = new WeakMap<
  Application,
  Record<Layer, Array<Array<ParticleContainer>>>
>();

const PREVIOUS_TILEY = Array<number | undefined>();

function createContainer(zIndex: number): Container {
  const container = new Container();
  container.width = WIDTH;
  container.height = HEIGHT;
  container.zIndex = zIndex;
  container.sortableChildren = true;
  return container;
}

function createParticleContainer(zIndex: number): ParticleContainer {
  const container = new ParticleContainer(1024, {
    alpha: true,
  });
  container.zIndex = zIndex;
  container.width = WIDTH;
  container.height = TILE_PX;
  return container;
}

function createLayerContainers() {
  return {
    [Layer.BACKGROUND]: createContainer(Layer.BACKGROUND),
    [Layer.OBJECT]: createContainer(Layer.OBJECT),
    [Layer.USER_INTERFACE]: createContainer(Layer.USER_INTERFACE),
  } as Record<Layer, Container>;
}

function createLayerTileYTextureContainers(): Record<
  Layer,
  Array<Array<ParticleContainer>>
> {
  const containers = {
    [Layer.BACKGROUND]: [],
    [Layer.OBJECT]: [],
    [Layer.USER_INTERFACE]: [],
  } as Record<Layer, Array<Array<ParticleContainer>>>;

  for (let tileY = 0; tileY < SCREEN_TILE; tileY++) {
    for (let layer = Layer.BACKGROUND; layer <= Layer.USER_INTERFACE; layer++) {
      containers[layer][tileY] = [];
    }
  }
  return containers;
}

function getTextureContainer(
  app: Application,
  tileY: number,
  layer: Layer,
  imageId: number,
): ParticleContainer | undefined {
  return LAYER_TILEY_TEXTURE_CONTAINER_MAP.get(app)![layer][tileY][imageId];
}

function getLayerContainer(
  app: Application,
  layer: Layer,
): Container | undefined {
  return LAYER_CONTAINER_MAP.get(app)![layer];
}

function _isTileY(tileY: Tiles) {
  return (id: number) => convertPixelsToTiles(getPositionY(id)) === tileY;
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

function getSpriteEntities(tileY: Tiles): ReadonlyArray<number> {
  spriteIds.length = 0;
  return executeFilterQuery(
    and(hasSprite, hasPositionX, hasPositionY, hasLookLike, _isTileY(tileY)),
    spriteIds,
  );
}

function listSpritesEntitiesToBeRemoved(tileY: Tiles): ReadonlyArray<number> {
  spriteIds.length = 0;
  return executeFilterQuery(
    and(hasSprite, isToBeRemoved, _isTileY(tileY)),
    spriteIds,
  );
}

export function RenderSystem() {
  // TODO[perf] use a dirty tag component instead of this flag
  if (!_isDirty) return;

  for (const spriteId of getEntitiesNeedingSprites()) {
    for (let tileY = 0; tileY < SCREEN_TILE; tileY++) {
      const image = getImage(getLookLike(spriteId));
      const sprite = new Sprite(image.texture!);
      const app = getPixiApp(getPixiAppId(spriteId));
      sprite.width = SPRITE_SIZE[0];
      sprite.height = SPRITE_SIZE[1];

      const layer = getLayer(spriteId);
      const tileYTextureContainers =
        LAYER_TILEY_TEXTURE_CONTAINER_MAP.get(app)![layer];
      const imageId = getLookLike(spriteId);
      const layerContainer = getLayerContainer(app, layer)!;
      let textureContainers = tileYTextureContainers[tileY];
      if (!textureContainers) {
        textureContainers = tileYTextureContainers[tileY] = [];
      }
      let textureContainer = textureContainers[imageId];

      if (!textureContainer) {
        textureContainer = tileYTextureContainers[tileY][imageId] =
          createParticleContainer(tileY);
        textureContainer.y = convertTilesToPixels(tileY as Tiles);
        layerContainer.addChild(textureContainer);
      }
      setSprite(spriteId, sprite);
    }
  }

  for (let tileY = 0; tileY < SCREEN_TILE; tileY++) {
    for (const spriteId of getSpriteEntities(tileY as Tiles)) {
      const sprite = getSprite(spriteId);
      const app = getPixiApp(getPixiAppId(spriteId));
      const layer = getLayer(spriteId);
      const textureContainer = getTextureContainer(
        app,
        tileY,
        layer,
        getLookLike(spriteId),
      );
      const isVisible = hasIsVisible(spriteId) ? getIsVisible(spriteId) : true;
      sprite.x = getPositionX(spriteId);
      const prevTileY = PREVIOUS_TILEY[spriteId];
      sprite.texture = getImage(getLookLike(spriteId)).texture!;
      if (textureContainer) {
        sprite.y = 0;
        if (prevTileY !== undefined && prevTileY !== tileY) {
          const prevTextureContainer = getTextureContainer(
            app,
            PREVIOUS_TILEY[spriteId]!,
            layer,
            getLookLike(spriteId),
          );

          prevTextureContainer!.removeChild(sprite);
        }

        // TODO(Patrick): possible bug in pixi https://github.com/pixijs/pixijs/issues/9845
        if (!isVisible) {
          textureContainer.removeChild(sprite);
        } else if (!textureContainer.children.includes(sprite)) {
          textureContainer.addChild(sprite);
        }
      } else {
        sprite.visible = isVisible;
      }
      PREVIOUS_TILEY[spriteId] = tileY;
    }

    // clean up sprites of deleted entities
    for (const spriteId of listSpritesEntitiesToBeRemoved(tileY as Tiles)) {
      const sprite = getSprite(spriteId);
      const app = getPixiApp(getPixiAppId(spriteId));
      const layer = getLayer(spriteId);
      const container = getTextureContainer(
        app,
        tileY,
        layer,
        getLookLike(spriteId),
      );
      if (container) {
        container.removeChild(sprite);
      } else {
        app.stage.removeChild(sprite);
      }
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
  const layerContainers = createLayerContainers();
  LAYER_CONTAINER_MAP.set(app, layerContainers);
  LAYER_TILEY_TEXTURE_CONTAINER_MAP.set(
    app,
    createLayerTileYTextureContainers(),
  );

  for (let layer = Layer.BACKGROUND; layer <= Layer.USER_INTERFACE; layer++) {
    const container = layerContainers[layer];
    app.stage.addChild(container);
  }
  parent.appendChild(app.view as any);
  return app;
}

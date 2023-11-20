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
  SCREENX_PX,
  SCREENY_PX,
  SCREEN_TILE,
  TILEX_PX,
  convertPixelsToTilesY,
  convertTilesYToPixels,
} from "../units/convert";
import {
  createContainer,
  createParticleContainer,
  createZSortableContainer,
} from "../functions/PixiHelpers";

const WIDTH = SCREENX_PX;
const HEIGHT = SCREENY_PX;

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

function createLayerContainers() {
  return {
    [Layer.BACKGROUND]: createContainer(WIDTH, HEIGHT, Layer.BACKGROUND),
    [Layer.OBJECT]: createZSortableContainer(WIDTH, HEIGHT, Layer.OBJECT),
    [Layer.USER_INTERFACE]: createContainer(
      WIDTH,
      HEIGHT,
      Layer.USER_INTERFACE,
    ),
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

function _isTileY(tileY: TilesY) {
  return (id: number) => convertPixelsToTilesY(getPositionY(id)) === tileY;
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

function getSpriteEntities(tileY: TilesY): ReadonlyArray<number> {
  spriteIds.length = 0;
  return executeFilterQuery(
    and(hasSprite, hasPositionX, hasPositionY, hasLookLike, _isTileY(tileY)),
    spriteIds,
  );
}

function listSpritesEntitiesToBeRemoved(tileY: TilesY): ReadonlyArray<number> {
  spriteIds.length = 0;
  return executeFilterQuery(
    and(hasSprite, isToBeRemoved, _isTileY(tileY)),
    spriteIds,
  );
}

export function setUpParticleContainerArrays<
  ParticleContainer,
  ParticleContainerArrays extends Array<Array<ParticleContainer>>,
>(
  imageId: number,
  tileYMin: number,
  tileYMax: number,
  arrays: ParticleContainerArrays,
  setUpParticleContainer: (tileY: number) => ParticleContainer,
) {
  for (let tileY = tileYMin; tileY <= tileYMax; tileY++) {
    let imageKeyedParticleContainers = arrays[tileY];
    if (!imageKeyedParticleContainers) {
      imageKeyedParticleContainers = arrays[tileY] = [];
    }

    let particleContainer = imageKeyedParticleContainers[imageId];
    if (!particleContainer) {
      particleContainer = arrays[tileY][imageId] =
        setUpParticleContainer(tileY);
    }
  }
}

export function RenderSystem() {
  // TODO[perf] use a dirty tag component instead of this flag
  if (!_isDirty) return;

  for (const spriteId of getEntitiesNeedingSprites()) {
    const imageId = getLookLike(spriteId);
    const image = getImage(imageId);
    const sprite = new Sprite(image.texture!);
    const app = getPixiApp(getPixiAppId(spriteId));
    sprite.width = SPRITE_SIZE[0];
    sprite.height = SPRITE_SIZE[1];

    const layer = getLayer(spriteId);

    const particleContainerArrays =
      LAYER_TILEY_TEXTURE_CONTAINER_MAP.get(app)![layer];
    setUpParticleContainerArrays(
      imageId,
      0,
      SCREEN_TILE - 1,
      particleContainerArrays,
      (tileY) => {
        const particleContainer = createParticleContainer(
          SCREENX_PX,
          TILEX_PX,
          tileY,
        );
        const layerContainer = getLayerContainer(app, layer)!;

        particleContainer.y = convertTilesYToPixels(tileY as TilesY);
        layerContainer.addChild(particleContainer);
        return particleContainer;
      },
    );
    setSprite(spriteId, sprite);
  }

  for (let tileY = 0; tileY < SCREEN_TILE; tileY++) {
    for (const spriteId of getSpriteEntities(tileY as TilesY)) {
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
    for (const spriteId of listSpritesEntitiesToBeRemoved(tileY as TilesY)) {
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

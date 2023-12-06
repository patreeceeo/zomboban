import { Application, Sprite, ParticleContainer, Container } from "pixi.js";
import { and, executeFilterQuery } from "../Query";
import { getImage, hasImage, setImage } from "../components/Image";
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
import {
  LoadingState,
  hasLoadingCompleted,
  setLoadingState,
} from "../components/LoadingState";
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
  VoidSprite,
  VoidContainer,
  createContainer,
  createParticleContainer,
  createZSortableContainer,
  updateSprite,
} from "../functions/PixiHelpers";
import { EntityName, getNamedEntity } from "../Entity";

const WIDTH = SCREENX_PX;
const HEIGHT = SCREENY_PX;

let _isDirty = false;

const entityIds: number[] = [];

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

function createLayerParticleContainerArrays(): Record<
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

function getOrCreateParticleContainer(
  app: Application,
  layer: Layer,
  tileY: number,
  imageId: number,
): ParticleContainer {
  const index2 = layer === Layer.OBJECT ? tileY : 0;
  const textureContainers =
    LAYER_TILEY_TEXTURE_CONTAINER_MAP.get(app)![layer][index2];
  let container = textureContainers[imageId];
  if (!container) {
    container = textureContainers[imageId] = createParticleContainer(
      SCREENX_PX,
      Layer.OBJECT ? TILEX_PX : SCREENY_PX,
      index2,
    );
    const layerContainer = getLayerContainer(app, layer)!;

    container.y = convertTilesYToPixels(index2 as TilesY);
    layerContainer.addChild(container);
  }
  return container;
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
  entityIds.length = 0;
  return executeFilterQuery((entityId) => {
    if (hasLookLike(entityId)) {
      const imageId = getLookLike(entityId);
      return hasLoadingCompleted(imageId) && !hasSprite(entityId);
    }
    return false;
  }, entityIds);
}

function getSpriteEntitiesByLayer(layer: Layer): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    and(
      hasSprite,
      hasPositionX,
      hasPositionY,
      hasLookLike,
      (id) => getLayer(id) === layer,
    ),
    entityIds,
  );
}

function getObjectSpriteEntitiesByTileY(tileY: TilesY): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    and(
      hasSprite,
      hasPositionX,
      hasPositionY,
      hasLookLike,
      _isTileY(tileY),
      (id) => getLayer(id) === Layer.OBJECT,
    ),
    entityIds,
  );
}

function listSpritesEntitiesToBeRemoved(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(and(hasSprite, isToBeRemoved), entityIds);
}

export function update3DishSprite<
  Texture,
  Sprite extends VoidSprite<Texture>,
  Container extends VoidContainer<Sprite>,
>(
  sprite: Sprite,
  container: Container,
  previousContainer: Container | undefined,
  positionX: Px,
  tileY: TilesY,
  previousTileY: number | undefined,
  texture: Texture,
  isVisible: boolean,
) {
  updateSprite(sprite, positionX, 0 as Px, texture, isVisible, container);
  if (previousTileY !== undefined && previousTileY !== tileY) {
    previousContainer!.removeChild(sprite);
  }
}

function updateLayer(layer: Layer) {
  for (const spriteId of getSpriteEntitiesByLayer(layer)) {
    const sprite = getSprite(spriteId);
    const app = getPixiApp(getPixiAppId(spriteId));
    const layer = getLayer(spriteId);
    const imageId = getLookLike(spriteId);
    const container = getOrCreateParticleContainer(app, layer, 0, imageId);
    const isVisible = hasIsVisible(spriteId) ? getIsVisible(spriteId) : true;
    const positionX = getPositionX(spriteId);
    const positionY = getPositionY(spriteId);
    const texture = getImage(imageId).texture!;
    updateSprite(sprite, positionX, positionY, texture, isVisible, container!);
  }
}

export function RenderSystem() {
  // TODO[perf] use a dirty tag component instead of this flag
  if (!_isDirty) return;

  const doorLeftId = getNamedEntity(EntityName.DOOR_LEFT_IMAGE);
  const doorRightId = getNamedEntity(EntityName.DOOR_RIGHT_IMAGE);
  if (
    hasImage(doorRightId) &&
    !hasImage(doorLeftId) &&
    hasLoadingCompleted(doorRightId)
  ) {
    const image = getImage(getNamedEntity(EntityName.DOOR_RIGHT_IMAGE));
    const flippedImage = image.clone().flipX();
    setImage(doorLeftId, flippedImage);
    setLoadingState(doorLeftId, LoadingState.PreCompleted);
  }

  for (const spriteId of getEntitiesNeedingSprites()) {
    const imageId = getLookLike(spriteId);
    const image = getImage(imageId);
    const sprite = new Sprite(image.texture!);
    sprite.width = SPRITE_SIZE[0];
    sprite.height = SPRITE_SIZE[1];

    setSprite(spriteId, sprite);
  }

  updateLayer(Layer.BACKGROUND);

  for (let tileY = 0; tileY < SCREEN_TILE; tileY++) {
    for (const spriteId of getObjectSpriteEntitiesByTileY(tileY as TilesY)) {
      const sprite = getSprite(spriteId);
      const app = getPixiApp(getPixiAppId(spriteId));
      const layer = getLayer(spriteId);
      const container = getOrCreateParticleContainer(
        app,
        layer,
        tileY,
        getLookLike(spriteId),
      );
      const isVisible = hasIsVisible(spriteId) ? getIsVisible(spriteId) : true;
      const positionX = getPositionX(spriteId);
      const texture = getImage(getLookLike(spriteId)).texture!;
      const previousTileY = PREVIOUS_TILEY[spriteId];
      const previousContainer =
        previousTileY !== undefined
          ? getOrCreateParticleContainer(
              app,
              layer,
              previousTileY,
              getLookLike(spriteId),
            )
          : undefined;

      update3DishSprite(
        sprite,
        container,
        previousContainer,
        positionX,
        tileY as TilesY,
        previousTileY,
        texture,
        isVisible,
      );
      PREVIOUS_TILEY[spriteId] = tileY;
    }
  }

  updateLayer(Layer.USER_INTERFACE);

  // clean up sprites of deleted entities
  for (const spriteId of listSpritesEntitiesToBeRemoved()) {
    const sprite = getSprite(spriteId);
    const app = getPixiApp(getPixiAppId(spriteId));
    const layer = getLayer(spriteId);
    const container = getOrCreateParticleContainer(
      app,
      layer,
      layer === Layer.OBJECT ? PREVIOUS_TILEY[spriteId]! : 0,
      getLookLike(spriteId),
    );
    (container! ?? app.stage).removeChild(sprite);
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
  const layerParticleContainerArrays = createLayerParticleContainerArrays();
  LAYER_TILEY_TEXTURE_CONTAINER_MAP.set(app, layerParticleContainerArrays);

  for (let layer = Layer.BACKGROUND; layer <= Layer.USER_INTERFACE; layer++) {
    const container = layerContainers[layer];
    app.stage.addChild(container);
    for (let tileY = 0; tileY < SCREEN_TILE; tileY++) {
      layerParticleContainerArrays[layer][tileY] = [];
    }
  }

  parent.appendChild(app.view as any);
  return app;
}

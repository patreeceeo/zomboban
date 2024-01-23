import {
  Application,
  Sprite,
  ParticleContainer,
  Container,
  AnimatedSprite,
  Texture,
} from "pixi.js";
import { Query, and, executeFilterQuery } from "../Query";
import { getImage, hasImage } from "../components/Image";
import { getLookLike, hasLookLike } from "../components/LookLike";
import { getPositionX, hasPositionX } from "../components/PositionX";
import { getPositionY, hasPositionY } from "../components/PositionY";
import {
  SPRITE_SIZE,
  getSprite,
  hasSprite,
  setSprite,
} from "../components/Sprite";
import { getPixiAppId, hasPixiAppId } from "../components/PixiAppId";
import { hasLoadingCompleted } from "../components/LoadingState";
import { Layer, getLayer } from "../components/Layer";
import { getIsVisible, hasIsVisible } from "../components/IsVisible";
import { getAllPixiApps, getPixiApp } from "../components/PixiApp";
import { isToBeRemoved } from "../components/EntityFrameOperation";
import {
  SCREENX_PX,
  SCREENY_PX,
  SCREEN_TILE,
  TILEX_PX,
  TILEY_PX,
  convertPixelsToTilesY,
  convertTilesYToPixels,
} from "../units/convert";
import {
  createContainer,
  createParticleContainer,
  createZSortableContainer,
  setVisibility,
} from "../functions/PixiHelpers";
import { Animation, getAnimation, hasAnimation } from "../components/Animation";
import { getTintOrDefault, removeTint, setTint } from "../components/Tint";
import { getTextSprite, hasText } from "../components/Text";
import { ActLike, getActLike } from "../components/ActLike";
import { invariant } from "../Error";
import { ReservedEntity } from "../entities";

/**
 * @fileoverview
 * This system is responsible for managing the PIXI Stage and DisplayObjects like containers and sprites.
 * Notably, it acheives a 3D-ish effect where sprites that are lower on the screen (higher PositionY)
 * overlap sprites that are higher (lower PositionY). I'm calling this the "tilt effect".
 */

// TODO before making an substantial changes to this file, try to write some tests for it.
// TODO rename to SpriteSystem and have this only manage sprites
// TODO use THREE.js instead of PIXI.js? react-three??
// TODO add FPS counter from pixi-cull example
// TODO maybe use @pixi/sprite-tiling, @inlet/react-pixi :O ?

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
  Record<Layer, Array<Array<ParticleContainer | undefined>>>
>();

/** Map spriteIds to the last particle container they were in
 */
const PREVIOUS_PARTICLE_CONTAINER_MAP = Array<ParticleContainer | undefined>();

function createLayerContainerMap() {
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

/**
 * To acheive the tilt effect, while keeping performance high, we need a lot of particle containers, since each
 * particle container can only have one texture. So we need one for each texture. But each possible tile-aligned PositionY
 * also requires its own container, so the total number of particle containers is (SCREEN_TILE + 2) * numTextures. That's just for the object layer.
 * The tilt effect is currently only being employed on the object layer so the other arrays will not have a particle container per
 * tile-aligned PositionY. Instead they'll have a particle container for the whole screen, for each texture.
 */
function createParticleContainerMap(): Record<
  Layer,
  Array<Array<ParticleContainer>>
> {
  const containers = {
    [Layer.BACKGROUND]: [],
    [Layer.OBJECT]: [],
    [Layer.USER_INTERFACE]: [],
  } as Record<Layer, Array<Array<ParticleContainer>>>;

  for (let tileY = 0; tileY <= SCREEN_TILE + 1; tileY++) {
    for (let layer = Layer.BACKGROUND; layer <= Layer.USER_INTERFACE; layer++) {
      containers[layer][tileY] = [];
    }
  }
  return containers;
}

function hasParticleContainer(
  app: Application,
  layer: Layer,
  containerId: number,
  imageId: number,
): boolean {
  const textureContainers =
    LAYER_TILEY_TEXTURE_CONTAINER_MAP.get(app)![layer][containerId];
  return !!textureContainers[imageId];
}

function setupParticleContainer(
  app: Application,
  layer: Layer,
  containerId: number,
  imageId: number,
): void {
  const textureContainers =
    LAYER_TILEY_TEXTURE_CONTAINER_MAP.get(app)![layer][containerId];
  const container = (textureContainers[imageId] = createParticleContainer(
    SCREENX_PX,
    Layer.OBJECT ? TILEY_PX : SCREENY_PX,
    containerId,
  ));
  const layerContainer = getLayerContainer(app, layer)!;

  layerContainer.addChild(container);
}

function getParticleContainer(
  app: Application,
  layer: Layer,
  containerId: number,
  imageId: number,
): ParticleContainer {
  const textureContainers =
    LAYER_TILEY_TEXTURE_CONTAINER_MAP.get(app)![layer][containerId];
  let container = textureContainers[imageId];
  invariant(!!container, "Container not found");
  return container!;
}

function getLayerContainer(
  app: Application,
  layer: Layer,
): Container | undefined {
  return LAYER_CONTAINER_MAP.get(app)![layer];
}

function _isTileY(tileYA: TilesY) {
  return (id: number) => {
    const tileYB = convertPixelsToTilesY(getPositionY(id));
    return Math.trunc(tileYA) === Math.trunc(tileYB);
  };
}

function hasSpriteTextureLoaded(spriteId: number): boolean {
  if (!hasLookLike(spriteId)) return false;
  const imageId = getLookLike(spriteId);
  return hasLoadingCompleted(imageId);
}

function getEntitiesNeedingSprites(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery((entityId) => {
    return hasSpriteTextureLoaded(entityId) && !hasSprite(entityId);
  }, entityIds);
}

function getSpriteEntitiesByLayer(layer: Layer): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    and(
      hasSprite,
      hasSpriteTextureLoaded,
      hasPositionX,
      hasPositionY,
      hasLookLike,
      (id) => getLayer(id) === layer,
    ),
    entityIds,
  );
}

// function listObjectSpriteEntities(
//   positionXMin: Px,
//   positionXMax: Px,
//   tileY: TilesY,
// ): ReadonlyArray<number> {
//   entityIds.length = 0;
//   return executeFilterQuery(
//     and(
//       hasSprite,
//       hasPositionX,
//       hasPositionY,
//       hasLookLike,
//       _isTileY(tileY),
//       (id) => {
//         const positionX = getPositionX(id);
//         return positionX >= positionXMin && positionX < positionXMax;
//       },
//       (id) => getLayer(id) === Layer.OBJECT,
//     ),
//     entityIds,
//   );
// }
const queryObjectSprites = Query.build()
  .addParam<Px, "positionXMin">("positionXMin")
  .addParam<Px, "positionXMax">("positionXMax")
  .addParam<TilesY, "tileY">("tileY")
  .complete(({ positionXMin, positionXMax, tileY }) =>
    and(
      hasSprite,
      hasPositionX,
      hasPositionY,
      hasLookLike,
      _isTileY(tileY),
      (id) => {
        const positionX = getPositionX(id);
        return positionX >= positionXMin && positionX < positionXMax;
      },
      (id) => getLayer(id) === Layer.OBJECT,
    ),
  );

function listSpritesEntitiesToBeRemoved(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(and(hasSprite, isToBeRemoved), entityIds);
}

function listTextEntities(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(and(hasText, hasPixiAppId), entityIds);
}

function updateLayer(layer: Layer) {
  for (const spriteId of getSpriteEntitiesByLayer(layer)) {
    const sprite = getSprite(spriteId);
    const app = getPixiApp(getPixiAppId(spriteId));
    const layer = getLayer(spriteId);
    const imageId = getLookLike(spriteId);
    const isVisible = hasIsVisible(spriteId) ? getIsVisible(spriteId) : true;
    const cameraId = ReservedEntity.CAMERA;
    const cameraX = getPositionX(cameraId);
    const cameraY = getPositionY(cameraId);
    const positionX = (getPositionX(spriteId) + SCREENX_PX / 2 - cameraX) as Px;
    const positionY = (getPositionY(spriteId) + SCREENY_PX / 2 - cameraY) as Px;

    invariant(layer !== Layer.OBJECT, "layer should not be object");
    if (!hasParticleContainer(app, layer, 0, imageId)) {
      setupParticleContainer(app, layer, 0, imageId);
    }

    if (hasImage(imageId)) {
      sprite.texture = getImage(imageId).texture!;
    }

    const container = getParticleContainer(app, layer, 0, imageId);
    sprite.x = positionX;
    sprite.y = positionY;
    setVisibility(sprite, isVisible, container);
    sprite.tint = getTintOrDefault(spriteId, 0xffffff);
  }
}

export function getRelativePositionY(
  containerHeight: Px,
  positionYOfSprite: Px,
) {
  return (positionYOfSprite % containerHeight) as Px;
}

// quick and dirty hack to allow changing animations on the same entity
const ANIMATIONS_BY_ID: Animation[] = [];

const OBJECT_Z_INDEX_MAP: Array<number> = [];
OBJECT_Z_INDEX_MAP[ActLike.AIRPLANE] = 0;
OBJECT_Z_INDEX_MAP[ActLike.PLAYER] = 1;
OBJECT_Z_INDEX_MAP[ActLike.BRO] = 2;
OBJECT_Z_INDEX_MAP[ActLike.WALL] = 3;
OBJECT_Z_INDEX_MAP[ActLike.BOX] = 4;

// TODO break into multiple kinds of operations
class RenderOperation {
  isCompleted = true;
  constructor(
    public spriteId: number,
    public container: Container<any> | undefined,
    public spriteIsVisible: boolean,
    public spriteX: number,
    public spriteY: number,
    public spriteTint: number,
    public newSpriteTexture: Texture | undefined,
    public newSpriteAnimation: Animation | undefined,
    public containerZIndex: number,
    public containerY: number,
  ) {}

  complete() {
    const {
      spriteId,
      container,
      spriteIsVisible,
      spriteX,
      spriteY,
      spriteTint,
      newSpriteTexture,
      newSpriteAnimation,
      containerZIndex,
      containerY,
    } = this;
    let sprite = getSprite(spriteId);

    invariant(sprite !== undefined, "expected a sprite");
    invariant(container !== undefined, "expected a container");

    container!.zIndex = containerZIndex;

    if (!!newSpriteTexture) {
      sprite!.texture = newSpriteTexture!;
    }

    if (!!newSpriteAnimation) {
      sprite!.destroy();
      sprite = new AnimatedSprite(newSpriteAnimation!.frames);
      (sprite as AnimatedSprite).play();
      setSprite(spriteId, sprite);
    }
    sprite!.x = spriteX;
    sprite!.y = spriteY;
    container!.y = containerY;
    sprite!.tint = spriteTint;
    setVisibility(sprite!, spriteIsVisible, container!);
    this.isCompleted = true;
  }
}

let _opReadCursor = 0;
let _opWriteCursor = 0;
const RENDER_OPERATION_POOL_SIZE = 512;
// TODO maybe use @pixi-essentials/object-pool?
const RENDER_OPERATIONS: RenderOperation[] = Array<RenderOperation>(
  RENDER_OPERATION_POOL_SIZE,
)
  .fill(undefined as any)
  .map(
    () =>
      new RenderOperation(
        0,
        undefined,
        false,
        0,
        0,
        0,
        undefined,
        undefined,
        0,
        0,
      ),
  );

export function RenderSystem() {
  // TODO[perf] use a dirty tag component instead of this flag
  if (!_isDirty) return;

  for (const spriteId of getEntitiesNeedingSprites()) {
    const imageId = getLookLike(spriteId);
    let sprite: Sprite;
    if (hasAnimation(imageId)) {
      const animation = getAnimation(imageId);
      sprite = new AnimatedSprite(animation.frames);
      (sprite as AnimatedSprite).play();
      ANIMATIONS_BY_ID[spriteId] = animation;
    } else {
      const image = getImage(imageId);
      sprite = new Sprite(image.texture!);
      sprite.width = Math.min(SPRITE_SIZE[0], image.texture!.width);
      sprite.height = Math.min(SPRITE_SIZE[1], image.texture!.height);
    }

    setSprite(spriteId, sprite);
  }

  updateLayer(Layer.BACKGROUND);

  // Update the object layer, which uses an array of sets of overlapping particle containers
  // to acheive the 3D tilt effect.
  const cameraId = ReservedEntity.CAMERA;
  const cameraY = getPositionY(cameraId);
  const cameraX = getPositionX(cameraId);
  const cameraTileY = Math.trunc(convertPixelsToTilesY(cameraY));
  const startTileY = (cameraTileY - SCREEN_TILE / 2 - 1) as TilesY;

  // clear all containers used on object layer
  for (const app of getAllPixiApps()) {
    const rowContainers =
      LAYER_TILEY_TEXTURE_CONTAINER_MAP.get(app)![Layer.OBJECT];
    for (const spriteContainers of rowContainers) {
      for (const container of spriteContainers) {
        container?.removeChildren();
      }
    }
  }

  for (
    let tileY = startTileY, containerIndex = 0;
    tileY <= startTileY + SCREEN_TILE + 1;
    tileY++, containerIndex++
  ) {
    queryObjectSprites
      .setParam("positionXMin", (cameraX - SCREENX_PX / 2 - TILEX_PX) as Px)
      .setParam("positionXMax", (cameraX + SCREENX_PX / 2) as Px)
      .setParam("tileY", tileY as TilesY);
    for (const spriteId of queryObjectSprites.execute()) {
      const app = getPixiApp(getPixiAppId(spriteId));
      const isVisible = hasIsVisible(spriteId) ? getIsVisible(spriteId) : true;
      const positionX = getPositionX(spriteId);
      const positionY = getPositionY(spriteId);
      const lookLike = getLookLike(spriteId);
      const tiltZIndex = convertPixelsToTilesY(
        (getPositionY(spriteId) + SCREENY_PX / 2 - cameraY) as Px,
      );
      const actLike = getActLike(spriteId).type;
      const op = RENDER_OPERATIONS[_opWriteCursor];
      _opWriteCursor = (_opWriteCursor + 1) % RENDER_OPERATION_POOL_SIZE;

      invariant(op.isCompleted, "render operation pool is too small");
      for (
        let containerIndex = 0;
        containerIndex <= SCREEN_TILE + 1;
        containerIndex++
      ) {
        if (
          !hasParticleContainer(app, Layer.OBJECT, containerIndex, lookLike)
        ) {
          setupParticleContainer(app, Layer.OBJECT, containerIndex, lookLike);
        }
      }

      const container = getParticleContainer(
        app,
        Layer.OBJECT,
        containerIndex,
        getLookLike(spriteId),
      );

      op.isCompleted = false;
      op.spriteId = spriteId;
      op.container = container;
      op.spriteIsVisible = isVisible;
      op.spriteX = positionX + SCREENX_PX / 2 - cameraX;
      op.spriteY = getRelativePositionY(TILEY_PX, positionY);
      op.spriteTint = getTintOrDefault(spriteId, 0xffffff);
      op.newSpriteTexture = hasImage(lookLike)
        ? getImage(lookLike).texture!
        : undefined;
      if (hasAnimation(lookLike)) {
        const animation = getAnimation(lookLike);
        op.newSpriteAnimation =
          ANIMATIONS_BY_ID[spriteId] !== animation ? animation : undefined;
        ANIMATIONS_BY_ID[spriteId] = animation;
      }
      op.containerZIndex =
        (OBJECT_Z_INDEX_MAP[actLike] ?? 0) +
        tiltZIndex * 10 +
        getLayer(spriteId) * 100;
      op.containerY =
        convertTilesYToPixels(tileY as TilesY) + SCREENY_PX / 2 - cameraY;
      PREVIOUS_PARTICLE_CONTAINER_MAP[spriteId] = container;
    }
  }

  // console.log("operation count", (_opWriteCursor - _opReadCursor + RENDER_OPERATION_POOL_SIZE) % RENDER_OPERATION_POOL_SIZE);
  while (_opReadCursor !== _opWriteCursor) {
    const op = RENDER_OPERATIONS[_opReadCursor];
    _opReadCursor = (_opReadCursor + 1) % RENDER_OPERATION_POOL_SIZE;
    op.complete();
  }

  updateLayer(Layer.USER_INTERFACE);

  for (const id of listTextEntities()) {
    const sprite = getTextSprite(id);
    const app = getPixiApp(getPixiAppId(id));
    const container = getLayerContainer(app, Layer.USER_INTERFACE)!;
    const isVisible = hasIsVisible(id) ? getIsVisible(id) : true;
    sprite.x = (SCREENX_PX - sprite.width) / 2;
    sprite.y = hasPositionY(id) ? getPositionY(id) : 0;
    setVisibility(sprite, isVisible, container);
  }

  // clean up sprites of deleted entities
  for (const spriteId of listSpritesEntitiesToBeRemoved()) {
    const sprite = getSprite(spriteId) as Sprite;
    const app = getPixiApp(getPixiAppId(spriteId));
    const container = PREVIOUS_PARTICLE_CONTAINER_MAP[spriteId];
    (container! ?? app.stage).removeChild(sprite);
  }

  _isDirty = false;
}

export function setRenderStateDirty() {
  _isDirty = true;
}

export function startRenderSystem(app: Application): void {
  app.stage.sortableChildren = true;
  const layerContainers =
    LAYER_CONTAINER_MAP.get(app) ?? createLayerContainerMap();
  LAYER_CONTAINER_MAP.set(app, layerContainers);
  const layerParticleContainerArrays =
    LAYER_TILEY_TEXTURE_CONTAINER_MAP.get(app) ?? createParticleContainerMap();
  LAYER_TILEY_TEXTURE_CONTAINER_MAP.set(app, layerParticleContainerArrays);

  for (let layer = Layer.BACKGROUND; layer <= Layer.USER_INTERFACE; layer++) {
    const container = layerContainers[layer];
    app.stage.addChild(container);
  }
}

export function stopRenderSystem(app: Application) {
  if (!LAYER_CONTAINER_MAP.has(app)) return;

  const layerContainers = LAYER_CONTAINER_MAP.get(app)!;
  for (let layer = Layer.BACKGROUND; layer <= Layer.USER_INTERFACE; layer++) {
    const container = layerContainers[layer];
    app.stage.removeChild(container);
  }
}

// TODO: better name
export function applyFadeEffect(entityIds: readonly number[]) {
  for (const id of entityIds) {
    setTint(id, 0x990000);
  }
}

export function removeFadeEffect(entityIds: readonly number[]) {
  for (const id of entityIds) {
    removeTint(id);
  }
}

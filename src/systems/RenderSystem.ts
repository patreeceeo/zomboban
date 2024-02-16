import {
  Sprite,
  ParticleContainer,
  Container,
  AnimatedSprite,
  Texture,
} from "pixi.js";
import { and, executeFilterQuery } from "../Query";
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
import { invariant } from "../Error";
import { ReservedEntity } from "../entities";
import { state } from "../state";
import { LayerId, LayerIdComponent } from "../components/LayerId";
import { Animation, AnimationComponent } from "../components/Animation";
import { SPRITE_SIZE } from "../components/Sprite";
import {
  ImageComponent,
  ImageIdComponent,
  IsVisibleComponent,
  PositionComponent,
  PositionXComponent,
  PositionYComponent,
  TintComponent,
} from "../components";
import {
  LoadingState,
  LoadingStateComponent,
} from "../components/LoadingState";

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

const LAYER_CONTAINER_MAP: Record<LayerId, Container> = {
  [LayerId.Background]: createContainer(WIDTH, HEIGHT, LayerId.Background),
  [LayerId.Object]: createZSortableContainer(WIDTH, HEIGHT, LayerId.Object),
  [LayerId.UI]: createContainer(WIDTH, HEIGHT, LayerId.UI),
};

/**
 * To acheive the tilt effect, while keeping performance high, we need a lot of particle containers, since each
 * particle container can only have one texture. So we need one for each texture. But each possible tile-aligned PositionY
 * also requires its own container, so the total number of particle containers is (SCREEN_TILE + 2) * numTextures. That's just for the object layer.
 * The tilt effect is currently only being employed on the object layer so the other arrays will not have a particle container per
 * tile-aligned PositionY. Instead they'll have a particle container for the whole screen, for each texture.
 */
const LAYER_TILEY_TEXTURE_CONTAINER_MAP: Record<
  LayerId,
  Array<Array<ParticleContainer | undefined>>
> = {
  [LayerId.Background]: [],
  [LayerId.Object]: [],
  [LayerId.UI]: [],
};
for (let tileY = 0; tileY <= SCREEN_TILE + 1; tileY++) {
  for (let layer = LayerId.Background; layer <= LayerId.UI; layer++) {
    LAYER_TILEY_TEXTURE_CONTAINER_MAP[layer][tileY] = [];
  }
}

/** Map spriteIds to the last particle container they were in
 */
const PREVIOUS_PARTICLE_CONTAINER_MAP = Array<ParticleContainer | undefined>();

function hasParticleContainer(
  layer: LayerId,
  containerId: number,
  imageId: number,
): boolean {
  return !!LAYER_TILEY_TEXTURE_CONTAINER_MAP[layer][containerId][imageId];
}

function setupParticleContainer(
  layer: LayerId,
  containerId: number,
  imageId: number,
): void {
  const textureContainers =
    LAYER_TILEY_TEXTURE_CONTAINER_MAP[layer][containerId];
  const container = (textureContainers[imageId] = createParticleContainer(
    SCREENX_PX,
    LayerId.Object ? TILEY_PX : SCREENY_PX,
    containerId,
  ));
  const layerContainer = getLayerContainer(layer);

  layerContainer.addChild(container);
}

function getParticleContainer(
  layer: LayerId,
  containerId: number,
  imageId: number,
): ParticleContainer {
  const textureContainers =
    LAYER_TILEY_TEXTURE_CONTAINER_MAP[layer][containerId];
  let container = textureContainers[imageId];
  invariant(!!container, "Container not found");
  return container!;
}

function getLayerContainer(layer: LayerId): Container {
  invariant(
    LAYER_CONTAINER_MAP[layer] !== undefined,
    `${layer} Layer container not found`,
  );
  return LAYER_CONTAINER_MAP[layer]!;
}

function hasSpriteTextureLoaded(spriteId: number): boolean {
  if (!state.has(ImageIdComponent, spriteId)) return false;
  const imageId = state.get(ImageIdComponent, spriteId);
  return state.is(LoadingStateComponent, imageId, LoadingState.Completed);
}

function getEntitiesNeedingSprites(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    (entityId) => {
      return hasSpriteTextureLoaded(entityId) && !state.hasSprite(entityId);
    },
    entityIds,
    state.addedEntities,
  );
}

function getSpriteEntitiesByLayer(layer: LayerId): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    (entityId) =>
      state.has(PositionComponent, entityId) &&
      state.is(LayerIdComponent, entityId, layer) &&
      state.hasSprite(entityId) &&
      hasSpriteTextureLoaded(entityId) &&
      state.has(ImageIdComponent, entityId),
    entityIds,
    state.addedEntities,
  );
}

function isObjectLayerSprite(entityId: number) {
  return (
    state.has(PositionComponent, entityId) &&
    state.has(ImageIdComponent, entityId) &&
    state.hasSprite(entityId) &&
    state.is(LayerIdComponent, entityId, LayerId.Object)
  );
}

function isTileY(entityId: number, tileYA: TilesY) {
  const tileYB = convertPixelsToTilesY(state.get(PositionYComponent, entityId));
  return Math.trunc(tileYA) === Math.trunc(tileYB);
}

function isPositionXWithin(
  entityId: number,
  positionXMin: Px,
  positionXMax: Px,
) {
  const positionX = state.get(PositionXComponent, entityId);
  return positionX >= positionXMin && positionX < positionXMax;
}

const queryObjectLayerSpritesWithCulling = state
  .buildQuery(
    [
      // IsRenderDirtyComponent,
      PositionComponent,
      LayerIdComponent,
      ImageIdComponent,
    ],
    {
      name: "ObjectLayerSpritesWithCulling",
    },
  )
  .addParam("positionXMin", 0 as Px)
  .addParam("positionXMax", 0 as Px)
  .addParam("tileY", 0 as TilesY)
  .complete(({ entityId, positionXMin, positionXMax, tileY }) => {
    return (
      isObjectLayerSprite(entityId) &&
      isTileY(entityId, tileY) &&
      isPositionXWithin(entityId, positionXMin, positionXMax)
    );
  });

function listSpritesEntitiesToBeRemoved(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    and(state.hasSprite, state.isEntityRemovedThisFrame),
    entityIds,
    state.addedEntities,
  );
}

function updateLayer(layerId: LayerId) {
  invariant(layerId !== LayerId.Object, "layer should not be object");
  for (const spriteId of getSpriteEntitiesByLayer(layerId)) {
    const sprite = state.getSprite(spriteId);
    const imageId = state.get(ImageIdComponent, spriteId);
    const isVisible = state.get(IsVisibleComponent, spriteId);
    const cameraId = ReservedEntity.CAMERA;
    const cameraX = state.get(PositionXComponent, cameraId);
    const cameraY = state.get(PositionYComponent, cameraId);
    const positionX = (state.get(PositionXComponent, spriteId) +
      SCREENX_PX / 2 -
      cameraX) as Px;
    const positionY = (state.get(PositionYComponent, spriteId) +
      SCREENY_PX / 2 -
      cameraY) as Px;

    if (!hasParticleContainer(layerId, 0, imageId)) {
      setupParticleContainer(layerId, 0, imageId);
    }

    if (state.has(ImageComponent, imageId)) {
      sprite.texture = state.get(ImageComponent, imageId).texture!;
    }

    const container = getParticleContainer(layerId, 0, imageId);
    sprite.x = positionX;
    sprite.y = positionY;
    setVisibility(sprite, isVisible, container);
    sprite.tint = state.get(TintComponent, spriteId, 0xffffff);
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
OBJECT_Z_INDEX_MAP[ReservedEntity.POTION_SPIN_ANIMATION] = 0;
OBJECT_Z_INDEX_MAP[ReservedEntity.PLAYER_DOWN_IMAGE] = 1;
OBJECT_Z_INDEX_MAP[ReservedEntity.ZOMBIE_SWAY_ANIMATION] = 2;
OBJECT_Z_INDEX_MAP[ReservedEntity.WALL_IMAGE] = 3;
OBJECT_Z_INDEX_MAP[ReservedEntity.CRATE_IMAGE] = 4;

// TODO break into multiple kinds of operations
// TODO use action system?
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
    let sprite = state.getSprite(spriteId);

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
      state.setSprite(spriteId, sprite);
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
    const imageId = state.get(ImageIdComponent, spriteId);
    let sprite: Sprite;
    if (state.has(AnimationComponent, imageId)) {
      const animation = state.get(AnimationComponent, imageId);
      sprite = new AnimatedSprite(animation.frames);
      (sprite as AnimatedSprite).play();
      ANIMATIONS_BY_ID[spriteId] = animation;
    } else {
      const image = state.get(ImageComponent, imageId);
      image;
      sprite = new Sprite(image.texture!);
      sprite.width = Math.min(SPRITE_SIZE[0], image.texture!.width);
      sprite.height = Math.min(SPRITE_SIZE[1], image.texture!.height);
    }

    state.setSprite(spriteId, sprite);
  }

  updateLayer(LayerId.Background);

  // Update the object layer, which uses an array of sets of overlapping particle containers
  // to acheive the 3D tilt effect.
  const cameraId = ReservedEntity.CAMERA;
  const { x: cameraX, y: cameraY } = state.get(PositionComponent, cameraId);
  const cameraTileY = Math.trunc(convertPixelsToTilesY(cameraY));
  const startTileY = (cameraTileY - SCREEN_TILE / 2 - 1) as TilesY;

  // clear all containers used on object layer
  const rowContainers = LAYER_TILEY_TEXTURE_CONTAINER_MAP[LayerId.Object];
  for (const spriteContainers of rowContainers) {
    for (const container of spriteContainers) {
      container?.removeChildren();
    }
  }

  for (
    let tileY = startTileY, containerIndex = 0;
    tileY <= startTileY + SCREEN_TILE + 1;
    tileY++, containerIndex++
  ) {
    queryObjectLayerSpritesWithCulling
      .setParam("positionXMin", (cameraX - SCREENX_PX / 2 - TILEX_PX) as Px)
      .setParam("positionXMax", (cameraX + SCREENX_PX / 2) as Px)
      .setParam("tileY", tileY as TilesY);
    for (const spriteId of queryObjectLayerSpritesWithCulling()) {
      const isVisible = state.get(IsVisibleComponent, spriteId);
      const { x: positionX, y: positionY } = state.get(
        PositionComponent,
        spriteId,
      );
      const lookLike = state.get(ImageIdComponent, spriteId);
      const tiltZIndex = convertPixelsToTilesY(
        (positionY + SCREENY_PX / 2 - cameraY) as Px,
      );
      const op = RENDER_OPERATIONS[_opWriteCursor];
      _opWriteCursor = (_opWriteCursor + 1) % RENDER_OPERATION_POOL_SIZE;

      invariant(op.isCompleted, "render operation pool is too small");
      for (
        let containerIndex = 0;
        containerIndex <= SCREEN_TILE + 1;
        containerIndex++
      ) {
        if (!hasParticleContainer(LayerId.Object, containerIndex, lookLike)) {
          setupParticleContainer(LayerId.Object, containerIndex, lookLike);
        }
      }

      const container = getParticleContainer(
        LayerId.Object,
        containerIndex,
        lookLike,
      );

      op.isCompleted = false;
      op.spriteId = spriteId;
      op.container = container;
      op.spriteIsVisible = isVisible;
      op.spriteX = positionX + SCREENX_PX / 2 - cameraX;
      op.spriteY = getRelativePositionY(TILEY_PX, positionY);
      op.spriteTint = state.get(TintComponent, spriteId, 0xffffff);
      op.newSpriteTexture = state.has(ImageComponent, lookLike)
        ? state.get(ImageComponent, lookLike).texture!
        : undefined;
      if (state.has(AnimationComponent, lookLike)) {
        const animation = state.get(AnimationComponent, lookLike);
        op.newSpriteAnimation =
          ANIMATIONS_BY_ID[spriteId] !== animation ? animation : undefined;
        ANIMATIONS_BY_ID[spriteId] = animation;
      }
      op.containerZIndex =
        (OBJECT_Z_INDEX_MAP[lookLike] ?? 0) +
        tiltZIndex * 10 +
        state.get(LayerIdComponent, spriteId) * 100;
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

  updateLayer(LayerId.UI);

  // clean up sprites of deleted entities
  for (const spriteId of listSpritesEntitiesToBeRemoved()) {
    const sprite = state.getSprite(spriteId) as Sprite;
    const container = PREVIOUS_PARTICLE_CONTAINER_MAP[spriteId];
    if (container) {
      container.removeChild(sprite);
    } else {
      state.pixiApp.stage.removeChild(sprite);
    }
    sprite.destroy();
  }

  _isDirty = false;
}

export function setRenderStateDirty() {
  _isDirty = true;
}

export function startRenderSystem(): void {
  for (let layer = LayerId.Background; layer <= LayerId.UI; layer++) {
    const container = getLayerContainer(layer);
    state.pixiApp.stage.addChild(container);
  }
}

export function stopRenderSystem() {
  for (let layer = LayerId.Background; layer <= LayerId.UI; layer++) {
    const container = getLayerContainer(layer);
    state.pixiApp.stage.addChild(container);
  }
}

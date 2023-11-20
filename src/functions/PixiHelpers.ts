import { ParticleContainer, Container } from "pixi.js";

export interface VoidSprite<Texture> {
  x: number;
  y: number;
  texture: Texture;
}

export interface VoidContainer<Sprite> {
  addChild: (...children: Array<Sprite>) => void;
  removeChild: (...children: Array<Sprite>) => void;
  children: Array<Sprite>;
}

export function createContainer(
  width: number,
  height: number,
  zIndex: number,
): Container {
  const container = new Container();
  container.width = width;
  container.height = height;
  container.zIndex = zIndex;
  return container;
}

export function createZSortableContainer(
  width: number,
  height: number,
  zIndex: number,
): Container {
  const container = new Container();
  container.width = width;
  container.height = height;
  container.zIndex = zIndex;
  container.sortableChildren = true;
  return container;
}

export function createParticleContainer(
  width: number,
  height: number,
  zIndex: number,
): ParticleContainer {
  const container = new ParticleContainer(1024, {
    alpha: true,
  });
  container.zIndex = zIndex;
  container.width = width;
  container.height = height;
  return container;
}

export function updateSprite<Texture, Sprite extends VoidSprite<Texture>>(
  sprite: Sprite,
  x: Px,
  y: Px,
  texture: Texture,
) {
  sprite.x = x;
  sprite.y = y;
  sprite.texture = texture;
}
